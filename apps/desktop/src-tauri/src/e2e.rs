//! Test hooks for `e2e/run.mjs`. Only builds with the `e2e` feature have them.

use std::{env, fs::OpenOptions, io::Write, path::PathBuf};

use tauri::{webview::DownloadEvent, WebviewWindowBuilder, Wry};

/// Adds the probe script from `QUILLS_DESKTOP_E2E_PROBE` to every page of the main window.
pub fn prepare<'a, M: tauri::Manager<Wry>>(
    builder: WebviewWindowBuilder<'a, Wry, M>,
) -> WebviewWindowBuilder<'a, Wry, M> {
    let Ok(path) = env::var("QUILLS_DESKTOP_E2E_PROBE") else {
        return builder;
    };
    let probe = std::fs::read_to_string(path).expect("the e2e probe script");
    let config = env::var("QUILLS_DESKTOP_E2E_CONFIG").unwrap_or_else(|_| "{}".into());
    builder.initialization_script(format!("window.__E2E__ = {config};\n{probe}"))
}

/// Keeps the window hidden, so a test run shows nothing on screen.
pub fn hidden() -> bool {
    env::var_os("QUILLS_DESKTOP_E2E_HIDDEN").is_some()
}

/// Writes a line to `QUILLS_DESKTOP_E2E_LOG` in place of opening a browser or focusing the
/// window. Returns false when no log is set.
pub fn log(line: &str) -> bool {
    let Some(path) = env::var_os("QUILLS_DESKTOP_E2E_LOG") else {
        return false;
    };
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .expect("the e2e log");
    writeln!(file, "{line}").expect("an e2e log line");
    true
}

/// Saves downloads to `QUILLS_DESKTOP_E2E_DOWNLOADS` in place of the Downloads folder.
pub fn redirect_download(event: DownloadEvent<'_>) {
    let (DownloadEvent::Requested { destination, .. }, Some(dir)) = (
        event,
        env::var_os("QUILLS_DESKTOP_E2E_DOWNLOADS").map(PathBuf::from),
    ) else {
        return;
    };
    let name = destination
        .file_name()
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| "download".into());
    *destination = dir.join(name);
}
