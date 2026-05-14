use keyring::Entry;
use serde::{Deserialize, Serialize};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm, jwk::JwkSet};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserProfile {
    pub id: String,
    pub username: String,
    pub email: String,
    pub language: Option<String>,
    pub role: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub success: bool,
    pub message: Option<String>,
    pub user: Option<UserProfile>,
    pub account_restored: Option<bool>,
    pub error_code: Option<String>,
    pub locked_until: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiLoginResponse {
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub user: Option<UserProfile>,
    pub account_restored: Option<bool>,
    pub error: Option<String>,
    pub error_code: Option<String>,
    pub locked_until: Option<String>,
}

pub fn get_keyring_entry() -> Result<Entry, keyring::Error> {
    Entry::new("syncsanctuary", "desktop_auth_refresh_token")
}

pub fn save_refresh_token(token: &str) -> Result<(), keyring::Error> {
    let entry = get_keyring_entry()?;
    entry.set_password(token)
}

pub fn get_refresh_token() -> Result<String, keyring::Error> {
    let entry = get_keyring_entry()?;
    entry.get_password()
}

pub fn delete_refresh_token() -> Result<(), keyring::Error> {
    let entry = get_keyring_entry()?;
    entry.delete_credential()
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub role: Option<String>,
    pub client_type: Option<String>,
    pub iat: usize,
    pub exp: usize,
    pub jti: Option<String>,
}

pub fn verify_jwt_local(token: &str, jwks: &JwkSet) -> Result<Claims, String> {
    // Decode header to find key ID (kid)
    let header = jsonwebtoken::decode_header(token).map_err(|e| e.to_string())?;
    let kid = header.kid.ok_or("No kid found in JWT header".to_string())?;

    // Find matching key
    let jwk = jwks.find(&kid).ok_or("No matching JWK found".to_string())?;

    // Create decoding key and validate
    let decoding_key = DecodingKey::from_jwk(&jwk).map_err(|e| e.to_string())?;
    let mut validation = Validation::new(Algorithm::RS256);
    // Add leniency for testing if needed
    validation.leeway = 60;

    let token_data = decode::<Claims>(token, &decoding_key, &validation)
        .map_err(|e| format!("JWT Validation Failed: {}", e))?;

    Ok(token_data.claims)
}
