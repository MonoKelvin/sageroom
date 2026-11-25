pub mod app;
pub mod attachments;
pub mod domain;
pub mod models;
pub mod news;
pub mod runtime;
pub mod secrets;
pub mod storage;

use tauri::Manager;

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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
            let main_window = handle.get_webview_window("main").ok_or("主窗口不存在。")?;
            app::window_frame::configure(&main_window)?;
            app.manage(app::tray::TrayState::default());
            app::lifecycle::install_tray(&handle)?;
            app::tray::install_popup(&handle)?;
            app::lifecycle::restore_window_state(&handle);
            app::tray::start_flasher(handle.clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app::commands::app_get_snapshot,
            app::commands::chat_send,
            app::commands::chat_recall,
            app::commands::chat_resolve_quotes,
            app::commands::chat_list,
            app::commands::chat_search,
            app::commands::cancel_search,
            app::commands::room_save,
            app::commands::appearance_save,
            app::commands::global_configuration_get,
            app::commands::global_configuration_save,
            app::commands::news_configuration_get,
            app::commands::news_configuration_save,
            app::commands::news_preview,
            app::commands::news_secret_status,
            app::commands::news_secret_set,
            app::commands::inbox_get,
            app::commands::inbox_mark_read,
            app::commands::inbox_set_muted,
            app::commands::tray_sync,
            app::commands::tray_open_main,
            app::commands::agent_list,
            app::commands::agent_delete,
            app::commands::agent_save,
            app::commands::agent_runtime_control,
            app::commands::user_profile_get,
            app::commands::user_profile_save,
            app::commands::secret_set,
            app::commands::secret_status,
            app::commands::model_profile_test,
            app::commands::model_profile_list,
            app::commands::experience_list,
            app::commands::experience_add,
            app::commands::experience_update,
            app::commands::experience_delete,
            app::commands::experience_prune,
            app::commands::development_model_import,
            app::commands::avatar_import,
            app::commands::avatar_read,
            app::commands::clipboard_read_text,
            app::commands::app_request_exit,
            app::commands::app_exit_ready,
        ])
        .on_window_event(|window, event| {
            if window.label() == "main"
                && let tauri::WindowEvent::CloseRequested { api, .. } = event
                && window
                    .app_handle()
                    .try_state::<app::state::AppState>()
                    .is_some_and(|state| !state.exit_completed())
            {
                api.prevent_close();
                app::lifecycle::save_window_state(&window.app_handle());
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("无法启动 Sageroom 桌面应用");

    app.run(|handle, event| {
        if let tauri::RunEvent::ExitRequested { api, .. } = event
            && !handle.state::<app::state::AppState>().exit_completed()
        {
            api.prevent_exit();
            app::lifecycle::request_exit(handle.clone());
        }
    });
}
