//! The menu bar: the standard menus, plus the server and sign-in actions, in the system language.

use tauri::{
    menu::{Menu, MenuBuilder, MenuEvent, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Manager, Wry,
};

use crate::{text::t, updates, window};

pub fn build(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let mut app_menu = SubmenuBuilder::new(app, "Quills")
        .about_with_text(t("menu.about"), None)
        .separator();
    if updates::enabled(app) {
        app_menu = app_menu
            .text("check-updates", t("menu.checkUpdates"))
            .separator();
    }
    let app_menu = app_menu
        .services_with_text(t("menu.services"))
        .separator()
        .hide_with_text(t("menu.hide"))
        .hide_others_with_text(t("menu.hideOthers"))
        .show_all_with_text(t("menu.showAll"))
        .separator()
        .quit_with_text(t("menu.quit"))
        .build()?;
    let edit = SubmenuBuilder::new(app, t("menu.edit"))
        .undo_with_text(t("menu.undo"))
        .redo_with_text(t("menu.redo"))
        .separator()
        .cut_with_text(t("menu.cut"))
        .copy_with_text(t("menu.copy"))
        .paste_with_text(t("menu.paste"))
        .select_all_with_text(t("menu.selectAll"))
        .build()?;
    let item = |id: &str, key: &str, accelerator: &str| {
        MenuItemBuilder::with_id(id, t(key))
            .accelerator(accelerator)
            .build(app)
    };
    let view = SubmenuBuilder::new(app, t("menu.view"))
        .item(&item("reload", "menu.reload", "CmdOrCtrl+R")?)
        .item(&item("back", "menu.back", "CmdOrCtrl+[")?)
        .item(&item("forward", "menu.forward", "CmdOrCtrl+]")?)
        .separator()
        .fullscreen_with_text(t("menu.fullScreen"))
        .build()?;
    let account = SubmenuBuilder::new(app, t("menu.account"))
        .text("sign-in", t("menu.signIn"))
        .text("change-server", t("menu.changeServer"))
        .build()?;
    let windows = SubmenuBuilder::new(app, t("menu.window"))
        .minimize_with_text(t("menu.minimize"))
        .maximize_with_text(t("menu.zoom"))
        .separator()
        .close_window_with_text(t("menu.closeWindow"))
        .build()?;
    MenuBuilder::new(app)
        .items(&[&app_menu, &edit, &view, &account, &windows])
        .build()
}

pub fn handle(app: &AppHandle, event: MenuEvent) {
    let Some(main) = app.get_webview_window(window::LABEL) else {
        return;
    };
    match event.id().as_ref() {
        "reload" => {
            let _ = main.reload();
        }
        "back" => {
            let _ = main.eval("history.back()");
        }
        "forward" => {
            let _ = main.eval("history.forward()");
        }
        "sign-in" => window::sign_in(app),
        "change-server" => window::show_picker(app),
        "check-updates" => updates::check(app.clone(), true),
        _ => {}
    }
}
