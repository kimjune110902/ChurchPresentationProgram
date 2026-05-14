mod auth;

use auth::{ApiLoginResponse, AuthResponse, UserProfile, delete_refresh_token, get_refresh_token, save_refresh_token, verify_jwt_local};
use jsonwebtoken::jwk::JwkSet;
use reqwest::Client;
use serde_json::json;
use std::sync::Mutex;
use tauri::State;
use tokio::sync::RwLock;

struct AppState {
    access_token: Mutex<Option<String>>,
    cached_user: Mutex<Option<UserProfile>>,
    jwks: RwLock<Option<JwkSet>>,
    client: Client,
    api_url: String,
}

impl AppState {
    async fn get_or_fetch_jwks(&self) -> Result<JwkSet, String> {
        let jwks_guard = self.jwks.read().await;
        if let Some(keys) = jwks_guard.as_ref() {
            return Ok(keys.clone());
        }
        drop(jwks_guard); // Release read lock before writing

        let jwks_url = format!("{}/api/v1/auth/.well-known/jwks.json", self.api_url);
        let res = self.client.get(&jwks_url).send().await.map_err(|e| e.to_string())?;

        let jwks_data: JwkSet = res.json().await.map_err(|e| e.to_string())?;

        let mut write_guard = self.jwks.write().await;
        *write_guard = Some(jwks_data.clone());
        Ok(jwks_data)
    }
}

#[tauri::command]
async fn login_user(
    email: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<AuthResponse, String> {
    let payload = json!({
        "identifier": email,
        "password": password,
        "client_type": "desktop",
        "remember_device": true
    });

    let res = state
        .client
        .post(format!("{}/api/v1/auth/login", state.api_url))
        .header("X-Client-Version", "1.0.0")
        .header("X-Client-Platform", std::env::consts::OS)
        .json(&payload)
        .send()
        .await;

    let response = match res {
        Ok(r) => r,
        Err(e) => return Err(format!("Network error: {}", e)),
    };

    let status = response.status();
    let data: ApiLoginResponse = match response.json().await {
        Ok(d) => d,
        Err(_) => return Err("Invalid response from server".to_string()),
    };

    if status.is_success() {
        if let Some(access) = data.access_token {
            *state.access_token.lock().unwrap() = Some(access);
        }
        if let Some(refresh) = data.refresh_token {
            let _ = save_refresh_token(&refresh);
        }
        if let Some(user_data) = &data.user {
             *state.cached_user.lock().unwrap() = Some(user_data.clone());
        }

        return Ok(AuthResponse {
            success: true,
            message: None,
            user: data.user,
            account_restored: data.account_restored,
            error_code: None,
            locked_until: None,
        });
    }

    if status.as_u16() == 423 {
        return Ok(AuthResponse {
            success: false,
            message: data.error.or(Some("Account locked".into())),
            user: None,
            account_restored: None,
            error_code: Some("ACCOUNT_LOCKED".into()),
            locked_until: data.locked_until,
        });
    }

    if status.as_u16() == 426 {
         return Ok(AuthResponse {
            success: false,
            message: data.error.or(Some("Client outdated. Please update.".into())),
            user: None,
            account_restored: None,
            error_code: Some("CLIENT_OUTDATED".into()),
            locked_until: None,
        });
    }

    if status.as_u16() == 401 {
        let error_code = data.error_code.as_deref().unwrap_or("UNKNOWN");
        if error_code == "USER_INACTIVE" {
            let _ = delete_refresh_token();
            *state.access_token.lock().unwrap() = None;
            *state.cached_user.lock().unwrap() = None;
            return Ok(AuthResponse {
                success: false,
                message: Some("Your account is scheduled for deletion. Log in with your password to cancel.".into()),
                user: None,
                account_restored: None,
                error_code: Some("USER_INACTIVE".into()),
                locked_until: None,
            });
        }
    }

    Ok(AuthResponse {
        success: false,
        message: data.error.or(Some("Invalid credentials".into())),
        user: None,
        account_restored: None,
        error_code: Some("UNAUTHORIZED".into()),
        locked_until: None,
    })
}

#[tauri::command]
async fn check_session(state: State<'_, AppState>) -> Result<AuthResponse, String> {
    // 1. Check process memory for Access Token
    let current_access_token = state.access_token.lock().unwrap().clone();

    // If we have an access token, try validating it locally via JWKS
    if let Some(token) = current_access_token {
        if let Ok(jwks) = state.get_or_fetch_jwks().await {
            if verify_jwt_local(&token, &jwks).is_ok() {
                let cached = state.cached_user.lock().unwrap().clone();
                if cached.is_some() {
                    return Ok(AuthResponse {
                        success: true,
                        message: None,
                        user: cached,
                        account_restored: None,
                        error_code: None,
                        locked_until: None,
                    });
                }
            }
        }

        // If validation fails or cache is missing, fall back to refresh
        *state.access_token.lock().unwrap() = None;
    }

    // 2. Fallback to OS Keychain for Refresh Token
    let refresh_token = match get_refresh_token() {
        Ok(t) => t,
        Err(_) => {
            return Ok(AuthResponse {
                success: false,
                message: Some("No saved session".into()),
                user: None,
                account_restored: None,
                error_code: None,
                locked_until: None,
            })
        }
    };

    let payload = json!({
        "refresh_token": refresh_token,
        "client_type": "desktop"
    });

    let res = state
        .client
        .post(format!("{}/api/v1/auth/refresh", state.api_url))
        .header("X-Client-Version", "1.0.0")
        .header("X-Client-Platform", std::env::consts::OS)
        .json(&payload)
        .send()
        .await;

    let response = match res {
        Ok(r) => r,
        Err(_) => {
            return Ok(AuthResponse {
                success: false,
                message: Some("Offline mode - network unavailable".into()),
                user: None,
                account_restored: None,
                error_code: Some("OFFLINE".into()),
                locked_until: None,
            })
        }
    };

    let status = response.status();
    let data: ApiLoginResponse = match response.json().await {
        Ok(d) => d,
        Err(_) => return Err("Invalid response from server".to_string()),
    };

    if status.is_success() {
        if let Some(access) = data.access_token {
            *state.access_token.lock().unwrap() = Some(access);
        }
        if let Some(refresh) = data.refresh_token {
            let _ = save_refresh_token(&refresh);
        }
        if let Some(user_data) = &data.user {
             *state.cached_user.lock().unwrap() = Some(user_data.clone());
        }
        return Ok(AuthResponse {
            success: true,
            message: None,
            user: data.user,
            account_restored: None,
            error_code: None,
            locked_until: None,
        });
    }

    if status.as_u16() == 401 {
        let error_code = data.error_code.as_deref().unwrap_or("TOKEN_REVOKED");
        let _ = delete_refresh_token();
        *state.access_token.lock().unwrap() = None;
        *state.cached_user.lock().unwrap() = None;

        if error_code == "TOKEN_THEFT_DETECTED" {
             return Ok(AuthResponse {
                success: false,
                message: Some("Security Alert: Session terminated".into()),
                user: None,
                account_restored: None,
                error_code: Some("TOKEN_THEFT_DETECTED".into()),
                locked_until: None,
            });
        }
        if error_code == "USER_INACTIVE" {
             return Ok(AuthResponse {
                success: false,
                message: Some("Your account is scheduled for deletion. Log in with your password to cancel.".into()),
                user: None,
                account_restored: None,
                error_code: Some("USER_INACTIVE".into()),
                locked_until: None,
            });
        }

        return Ok(AuthResponse {
            success: false,
            message: Some("Your session expired or your password was changed. Please log in again.".into()),
            user: None,
            account_restored: None,
            error_code: Some("TOKEN_REVOKED".into()),
            locked_until: None,
        });
    }

    Ok(AuthResponse {
        success: false,
        message: Some("Failed to refresh session".into()),
        user: None,
        account_restored: None,
        error_code: Some("UNKNOWN".into()),
        locked_until: None,
    })
}

#[tauri::command]
async fn logout_user(state: State<'_, AppState>) -> Result<AuthResponse, String> {
    let _ = delete_refresh_token();
    *state.access_token.lock().unwrap() = None;
    *state.cached_user.lock().unwrap() = None;
    Ok(AuthResponse {
        success: true,
        message: Some("Logged out successfully".into()),
        user: None,
        account_restored: None,
        error_code: None,
        locked_until: None,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap();

    // Default to dev environment if not set
    let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:3001".to_string());

    let state = AppState {
        access_token: Mutex::new(None),
        cached_user: Mutex::new(None),
        jwks: RwLock::new(None),
        client,
        api_url,
    };

    tauri::Builder::default()
        .manage(state)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            login_user,
            check_session,
            logout_user,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
