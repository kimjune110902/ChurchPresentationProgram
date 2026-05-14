use keyring::Entry;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserProfile {
    pub id: String,
    pub username: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub success: bool,
    pub message: Option<String>,
    pub user: Option<UserProfile>,
}

pub fn get_keyring_entry() -> Result<Entry, keyring::Error> {
    Entry::new("syncsanctuary", "desktop_auth_session")
}

pub fn save_session(user_json: &str) -> Result<(), keyring::Error> {
    let entry = get_keyring_entry()?;
    entry.set_password(user_json)
}

pub fn get_session() -> Result<String, keyring::Error> {
    let entry = get_keyring_entry()?;
    entry.get_password()
}

pub fn delete_session() -> Result<(), keyring::Error> {
    let entry = get_keyring_entry()?;
    entry.delete_credential()
}
