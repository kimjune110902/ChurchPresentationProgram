mod auth;

use auth::{AuthResponse, UserProfile, get_session, save_session, delete_session};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use std::sync::Mutex;
use tauri::State;

// Simulated local database mapping email -> (hash, UserProfile)
// In a real app, this would be SQLite or an API call.
struct SimulatedDB {
    users: Mutex<std::collections::HashMap<String, (String, UserProfile)>>,
}

#[tauri::command]
fn login_user(email: String, password: String, db: State<'_, SimulatedDB>) -> AuthResponse {
    let users = db.users.lock().unwrap();

    if let Some((hash, profile)) = users.get(&email) {
        let parsed_hash = match PasswordHash::new(hash) {
            Ok(h) => h,
            Err(_) => return AuthResponse {
                success: false,
                message: Some("Invalid internal password hash".into()),
                user: None
            }
        };

        if Argon2::default().verify_password(password.as_bytes(), &parsed_hash).is_ok() {
            let session_data = serde_json::to_string(profile).unwrap();
            let _ = save_session(&session_data);
            return AuthResponse {
                success: true,
                message: None,
                user: Some(profile.clone()),
            };
        }
    }

    AuthResponse {
        success: false,
        message: Some("Incorrect email or password.".into()),
        user: None,
    }
}

#[tauri::command]
fn check_session() -> AuthResponse {
    match get_session() {
        Ok(data) => {
            if let Ok(profile) = serde_json::from_str::<UserProfile>(&data) {
                return AuthResponse {
                    success: true,
                    message: None,
                    user: Some(profile),
                };
            }
        }
        Err(_) => {}
    }
    AuthResponse {
        success: false,
        message: Some("No active session".into()),
        user: None,
    }
}

#[tauri::command]
fn logout_user() -> AuthResponse {
    let _ = delete_session();
    AuthResponse {
        success: true,
        message: Some("Logged out successfully".into()),
        user: None,
    }
}

#[tauri::command]
fn signup_user(email: String, password: String, username: String, db: State<'_, SimulatedDB>) -> AuthResponse {
    let mut users = db.users.lock().unwrap();
    if users.contains_key(&email) {
         return AuthResponse {
             success: false,
             message: Some("An account with this email already exists.".into()),
             user: None
         }
    }

    let salt = SaltString::generate(&mut rand_core::OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt).unwrap().to_string();

    let user_id = uuid::Uuid::new_v4().to_string();
    let profile = UserProfile {
        id: user_id.clone(),
        username: username.clone(),
        email: email.clone()
    };

    users.insert(email.clone(), (password_hash, profile.clone()));

    let session_data = serde_json::to_string(&profile).unwrap();
    let _ = save_session(&session_data);

    AuthResponse {
        success: true,
        message: Some("Signup successful".into()),
        user: Some(profile)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut users = std::collections::HashMap::new();
    // Pre-populate with a demo user for testing existing UI
    let salt = SaltString::generate(&mut rand_core::OsRng);
    let password_hash = Argon2::default().hash_password("Password123!".as_bytes(), &salt).unwrap().to_string();
    users.insert("demo@example.com".to_string(), (
        password_hash,
        UserProfile {
            id: uuid::Uuid::new_v4().to_string(),
            username: "Demo User".to_string(),
            email: "demo@example.com".to_string(),
        }
    ));

    let db = SimulatedDB {
        users: Mutex::new(users),
    };

    tauri::Builder::default()
        .manage(db)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            login_user,
            check_session,
            logout_user,
            signup_user
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
