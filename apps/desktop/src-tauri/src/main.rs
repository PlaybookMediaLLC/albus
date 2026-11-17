#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(feature = "e2e")]
mod e2e;
mod links;
mod menu;
mod server;
mod text;
mod updates;
mod window;

fn main() {
    tauri::Builder::default()
        // First: a second launch focuses the running app and exits before it builds a window.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            window::focus(app)
        }))
        // Size, position and full screen. Never visibility: a hidden test window stays hidden.
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::all()
                        - tauri_plugin_window_state::StateFlags::VISIBLE,
                )
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            server::picker_state,
            server::normalize,
            server::connect
        ])
        .setup(|app| {
            let handle = app.handle();
            server::start(handle)?;
            updates::init(handle)?;
            app.set_menu(menu::build(handle)?)?;
            window::create(handle)?;
            Ok(())
        })
        .on_menu_event(menu::handle)
        .run(tauri::generate_context!())
        .expect("error while running the Quills desktop app");
}
