use tauri_build::{AppManifest, Attributes};

fn main() {
    // The "Quills Cloud" choice on the server picker: QUILLS_DESKTOP_CLOUD_URL, or else the
    // client URL in the fork's branding config. Empty hides the choice.
    let branding = std::path::Path::new("../../../branding/config.json");
    println!("cargo:rerun-if-changed={}", branding.display());
    println!("cargo:rerun-if-env-changed=QUILLS_DESKTOP_CLOUD_URL");
    let cloud = std::env::var("QUILLS_DESKTOP_CLOUD_URL")
        .ok()
        .or_else(|| {
            let text = std::fs::read_to_string(branding).ok()?;
            let config: serde_json::Value = serde_json::from_str(&text).ok()?;
            config["clientUrl"].as_str().map(String::from)
        })
        .unwrap_or_default();
    println!("cargo:rustc-env=QUILLS_DESKTOP_CLOUD_URL={cloud}");

    let commands = AppManifest::new().commands(&["picker_state", "normalize", "connect"]);
    tauri_build::try_build(Attributes::new().app_manifest(commands))
        .expect("failed to run the Tauri build script");
}
