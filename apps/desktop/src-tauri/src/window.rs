//! The main window. It opens on the bundled server picker, which connects to the saved server
//! or asks for one.

use tauri::{
    webview::{NewWindowResponse, PageLoadEvent},
    AppHandle, Manager, Url, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_opener::OpenerExt;

use crate::{
    links::{self, Route},
    server::{self, Server},
};

pub const LABEL: &str = "main";

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let navigation = app.clone();
    let popups = app.clone();
    let builder = WebviewWindowBuilder::new(app, LABEL, WebviewUrl::App("index.html".into()))
        .title("Quills")
        .inner_size(1280.0, 820.0)
        .min_inner_size(900.0, 600.0)
        .visible(false)
        .zoom_hotkeys_enabled(true)
        // The web app handles dropped files itself, for example attachments.
        .disable_drag_drop_handler()
        .initialization_script(links::LINK_SCRIPT)
        .on_navigation(move |url| allow(&navigation, url))
        .on_new_window(move |url, _features| {
            open_outside(&popups, &url);
            NewWindowResponse::Deny
        })
        // wry saves to the Downloads folder and numbers a taken name.
        .on_download(|_webview, _event| {
            #[cfg(feature = "e2e")]
            crate::e2e::redirect_download(_event);
            true
        })
        // Main-frame loads only, unlike navigations, so an iframe never moves the server.
        .on_page_load(|window, payload| {
            if payload.event() == PageLoadEvent::Finished {
                server::follow_move(window.app_handle(), payload.url());
            }
        })
        .on_document_title_changed(|window, title| {
            let _ = window.set_title(&title);
        });
    #[cfg(feature = "e2e")]
    let builder = crate::e2e::prepare(builder);
    let window = builder.build()?;
    #[cfg(feature = "e2e")]
    if crate::e2e::hidden() {
        return Ok(());
    }
    window.show()
}

fn allow(app: &AppHandle, url: &Url) -> bool {
    let current = app.state::<Server>().current();
    match links::route(url, current.as_ref()) {
        Route::App => true,
        Route::BrowserSignIn => {
            #[cfg(feature = "e2e")]
            crate::e2e::log(&format!("signin:{url}"));
            if let Some(current) = current {
                show(app, links::sign_in_page(&current, Some("google")));
            }
            false
        }
        Route::Outside => {
            open_outside(app, url);
            false
        }
        Route::Block => {
            #[cfg(feature = "e2e")]
            crate::e2e::log(&format!("blocked:{url}"));
            false
        }
    }
}

/// Loads `url` in the main window. It runs from a task, so a navigation callback can call it.
pub fn show(app: &AppHandle, url: Url) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Some(window) = app.get_webview_window(LABEL) {
            let _ = window.navigate(url);
        }
    });
}

/// The server picker with its form, for "Change Server…".
pub fn show_picker(app: &AppHandle) {
    // Tauri serves bundled pages at tauri://localhost, and at http://tauri.localhost on Windows.
    let base = if cfg!(windows) {
        "http://tauri.localhost/"
    } else {
        "tauri://localhost/"
    };
    show(
        app,
        Url::parse(base)
            .and_then(|base| base.join("index.html?change=true"))
            .expect("a fixed URL"),
    );
}

/// The browser sign-in page of the current server, or the picker when no server is set.
pub fn sign_in(app: &AppHandle) {
    match app.state::<Server>().current() {
        Some(current) => show(app, links::sign_in_page(&current, None)),
        None => show_picker(app),
    }
}

/// Opens a web or mail link in the default app. Other schemes are ignored.
pub fn open_outside(app: &AppHandle, url: &Url) {
    if !links::opens_outside(url) {
        return;
    }
    #[cfg(feature = "e2e")]
    if crate::e2e::log(url.as_str()) {
        return;
    }
    let _ = app.opener().open_url(url.as_str(), None::<&str>);
}

/// Brings the main window to the front, for example when the app is launched a second time.
pub fn focus(app: &AppHandle) {
    #[cfg(feature = "e2e")]
    if crate::e2e::log("event:focus") {
        return;
    }
    if let Some(window) = app.get_webview_window(LABEL) {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}
