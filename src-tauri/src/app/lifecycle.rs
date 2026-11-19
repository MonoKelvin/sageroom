use tauri::{
    AppHandle, Manager,
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

use super::state::AppState;

pub fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let result = window
            .unminimize()
            .and_then(|_| window.show())
            .and_then(|_| window.set_focus());
        if let Err(error) = result {
            eprintln!("无法还原主窗口：{error}");
        }
    } else {
        eprintln!("无法还原主窗口：main 窗口不存在。");
    }
}

pub fn install_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "打开聊天室", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出 Sageroom", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;
    TrayIconBuilder::with_id("sageroom")
        .icon(Image::from_bytes(include_bytes!("../../icons/icon.png"))?)
        .tooltip(format!(
            "{} 本地聊天室",
            app.config().product_name.as_deref().unwrap_or("Sageroom")
        ))
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "quit" => request_exit(app.clone()),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if matches!(
                event,
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                }
            ) {
                show_main(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

pub fn request_exit(app: AppHandle) {
    let Some(storage) = app.state::<AppState>().begin_shutdown() else {
        return;
    };
    tauri::async_runtime::spawn(async move {
        if let Ok(storage) = storage
            && let Err(error) = storage.shutdown().await
        {
            eprintln!("{error}");
        }
        app.exit(0);
    });
}
