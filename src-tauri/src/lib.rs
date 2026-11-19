pub mod app;
pub mod domain;
pub mod storage;

use tauri::Manager;

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let app = app.clone();
            tauri::async_runtime::spawn(async move {
                app::lifecycle::show_main(&app);
            });
        }))
        .setup(|app| {
            let handle = app.handle().clone();
            let directory = app.path().app_local_data_dir();
            app.manage(app::state::AppState::open(directory, handle.clone()));
            app::lifecycle::install_tray(&handle)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app::commands::app_get_snapshot,
            app::commands::chat_send,
            app::commands::chat_list,
            app::commands::chat_search,
            app::commands::cancel_search,
            app::commands::appearance_save,
            app::commands::app_request_exit,
        ])
        .on_window_event(|window, event| {
            if window.label() == "main"
                && let tauri::WindowEvent::CloseRequested { api, .. } = event
                && window
                    .app_handle()
                    .try_state::<app::state::AppState>()
                    .is_some_and(|state| !state.is_shutting_down())
            {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("无法启动 Sageroom 桌面应用");

    app.run(|handle, event| {
        if let tauri::RunEvent::ExitRequested { api, .. } = event
            && !handle.state::<app::state::AppState>().is_shutting_down()
        {
            api.prevent_exit();
            app::lifecycle::request_exit(handle.clone());
        }
    });
}
