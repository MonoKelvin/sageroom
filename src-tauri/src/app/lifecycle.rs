use std::{
    sync::Mutex,
    time::{Duration, Instant},
};

use tauri::{
    AppHandle, Emitter, Manager,
    image::Image,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};

use super::state::AppState;
use crate::domain::{contracts::*, error::AppResult};

const PREPARE_TIMEOUT: Duration = Duration::from_secs(8);

struct PendingExit {
    id: String,
    deadline: Instant,
    closing: bool,
}

#[derive(Default)]
pub struct ExitCoordinator(Mutex<Option<PendingExit>>);

impl ExitCoordinator {
    fn prepare(&self, now: Instant) -> Option<String> {
        let mut pending = self.0.lock().expect("退出锁被污染");
        if pending.is_some() {
            return None;
        }
        let id = uuid::Uuid::now_v7().to_string();
        *pending = Some(PendingExit {
            id: id.clone(),
            deadline: now + PREPARE_TIMEOUT,
            closing: false,
        });
        Some(id)
    }

    fn ready(
        &self,
        source: &str,
        generation: &str,
        request: &ExitReadyRequest,
        now: Instant,
    ) -> AppResult<bool> {
        if source != "main" {
            return Err(AppError::new(
                ErrorCode::PermissionDenied,
                "此窗口不能确认退出。",
            ));
        }
        if generation != request.data_generation_id {
            return Err(AppError::new(
                ErrorCode::DataGenerationChanged,
                "应用运行世代已改变，请重新确认退出。",
            ));
        }
        let mut pending = self.0.lock().expect("退出锁被污染");
        let current = pending
            .as_mut()
            .filter(|pending| pending.id == request.request_id)
            .ok_or_else(|| AppError::invalid("request_id", "退出准备请求不存在或已经使用。"))?;
        if current.closing {
            return Err(AppError::invalid("request_id", "退出确认已经使用。"));
        }
        if now >= current.deadline || !request.ready {
            *pending = None;
            return Ok(false);
        }
        current.closing = true;
        Ok(true)
    }

    fn expire(&self, id: &str, now: Instant) -> bool {
        let mut pending = self.0.lock().expect("退出锁被污染");
        if pending
            .as_ref()
            .is_some_and(|pending| pending.id == id && !pending.closing && now >= pending.deadline)
        {
            *pending = None;
            true
        } else {
            false
        }
    }

    fn cancel(&self, id: &str) {
        let mut pending = self.0.lock().expect("退出锁被污染");
        if pending.as_ref().is_some_and(|pending| pending.id == id) {
            *pending = None;
        }
    }
}

fn emit(app: &AppHandle, payload: AppLifecyclePayload) -> AppResult<()> {
    app.emit_to(
        "main",
        "sageroom://lifecycle",
        AppLifecycleEvent {
            schema_version: SchemaVersion::V0_3,
            data_generation_id: app.state::<AppState>().generation.clone(),
            payload,
        },
    )
    .map_err(|_| AppError::new(ErrorCode::IoError, "无法通知界面准备退出，退出已取消。"))
}

fn cancelled(app: &AppHandle, id: String, code: ErrorCode) -> AppError {
    // 只发白名单公开错误，不序列化底层错误、路径或凭据。
    let code = match code {
        ErrorCode::ShuttingDown | ErrorCode::IoError | ErrorCode::DbBusy => code,
        _ => ErrorCode::InternalError,
    };
    let error = AppError::new(
        code,
        "退出未完成，应用继续运行；请检查已应用的设置并稍后重试。",
    );
    if emit(
        app,
        AppLifecyclePayload::ExitCancelled {
            request_id: id,
            error: error.clone(),
        },
    )
    .is_err()
    {
        eprintln!("退出已取消，但界面通知未送达。");
    }
    show_main(app);
    error
}

/// 启动时恢复主窗口几何。位置落在任何显示器之外时只恢复尺寸，
/// 避免显示器断开或分辨率变化后窗口消失在屏幕外。
pub fn restore_window_state(app: &AppHandle) {
    let Some(state) = app.try_state::<AppState>() else { return };
    let Some(worker) = state.worker().ok() else { return };
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let Ok(Some(saved)) = worker.get_window_state(app.state::<AppState>().generation.clone()).await else {
            return;
        };
        let Some(window) = app.get_webview_window("main") else { return };
        if saved.width < 100.0 || saved.height < 100.0 {
            return;
        }
        if saved.maximized {
            let _ = window.maximize();
            return;
        }
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: saved.width,
            height: saved.height,
        }));
        let position = tauri::Position::Logical(tauri::LogicalPosition {
            x: saved.x,
            y: saved.y,
        });
        let inside = app
            .primary_monitor()
            .ok()
            .flatten()
            .is_some_and(|monitor| {
                let origin = monitor.position();
                let size = monitor.size();
                let scale = monitor.scale_factor();
                let (left, top) = (origin.x as f64 / scale, origin.y as f64 / scale);
                let (right, bottom) = (
                    left + size.width as f64 / scale,
                    top + size.height as f64 / scale,
                );
                saved.x >= left && saved.y >= top && saved.x < right && saved.y < bottom
            });
        if inside {
            let _ = window.set_position(position);
        }
    });
}

/// 关闭窗口（实际是隐藏）时保存几何，下次启动沿用用户习惯的布局。
pub fn save_window_state(app: &AppHandle) {
    let Some(window) = app.get_webview_window("main") else { return };
    let Ok(position) = window.outer_position() else { return };
    let Ok(size) = window.outer_size() else { return };
    let scale = window.scale_factor().unwrap_or(1.0).max(0.01);
    let state = crate::storage::configuration::WindowState {
        x: position.x as f64 / scale,
        y: position.y as f64 / scale,
        width: size.width as f64 / scale,
        height: size.height as f64 / scale,
        maximized: window.is_maximized().unwrap_or(false),
    };
    let Some(app_state) = app.try_state::<AppState>() else { return };
    let Ok(worker) = app_state.worker() else { return };
    let generation = app_state.generation.clone();
    tauri::async_runtime::spawn(async move {
        let _ = worker.save_window_state(generation, state).await;
    });
}

/// 主窗口关闭请求：按用户偏好决定隐藏到托盘还是退出应用。
/// 事件回调必须同步调用 prevent_close，读取偏好放到异步任务里完成。
pub fn handle_close_request(app: &AppHandle) {
    save_window_state(app);
    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let exit = match handle.try_state::<AppState>().and_then(|state| state.worker().ok()) {
            Some(worker) => {
                let generation = handle.state::<AppState>().generation.clone();
                worker.get_ui_preferences(generation).await
                    .is_ok_and(|preferences| preferences.close_action == crate::domain::contracts::CloseAction::Exit)
            }
            None => false,
        };
        if exit {
            request_exit(handle);
        } else if let Some(window) = handle.get_webview_window("main") {
            let _ = window.hide();
        }
    });
}

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
            super::tray::on_icon_event(tray.app_handle(), &event);
        })
        .build(app)?;
    Ok(())
}

pub fn request_exit(app: AppHandle) {
    if let Err(error) = prepare_exit(app.clone()) {
        eprintln!("{error}");
        show_main(&app);
    }
}

pub fn prepare_exit(app: AppHandle) -> AppResult<ExitResult> {
    let state = app.state::<AppState>();
    if state.is_recovering() {
        return Err(AppError::new(
            ErrorCode::ShuttingDown,
            "数据正在恢复，请稍后重新退出。",
        ));
    }
    if let Some(worker) = state.retry_recovery() {
        tauri::async_runtime::spawn(async move {
            let recovered = tauri::async_runtime::spawn_blocking(move || worker.recover())
                .await
                .unwrap_or_else(|_| {
                    Err(AppError::new(
                        ErrorCode::InternalError,
                        "数据工作线程恢复失败。",
                    ))
                });
            app.state::<AppState>().finish_recovery(recovered);
        });
        return Err(AppError::new(
            ErrorCode::ShuttingDown,
            "数据恢复已重新开始，请稍后再请求退出。",
        ));
    }
    if !state.has_initialized_storage() {
        // 数据初始化失败时没有可排空的写入，也不依赖前端 snapshot。
        state.begin_shutdown()?;
        state.complete_exit();
        app.exit(0);
        return Ok(ExitResult {
            shutting_down: true,
        });
    }
    let Some(id) = state.exits.prepare(Instant::now()) else {
        return Ok(ExitResult {
            shutting_down: false,
        });
    };
    if let Err(error) = emit(
        &app,
        AppLifecyclePayload::ExitPrepare {
            request_id: id.clone(),
        },
    ) {
        state.exits.cancel(&id);
        return Err(error);
    }
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(PREPARE_TIMEOUT).await;
        if app.state::<AppState>().exits.expire(&id, Instant::now()) {
            cancelled(&app, id, ErrorCode::ShuttingDown);
        }
    });
    Ok(ExitResult {
        shutting_down: false,
    })
}

pub async fn exit_ready(
    app: AppHandle,
    source: &str,
    request: ExitReadyRequest,
) -> AppResult<ExitResult> {
    let ready = {
        let state = app.state::<AppState>();
        state
            .exits
            .ready(source, &state.generation, &request, Instant::now())?
    };
    if !ready {
        cancelled(&app, request.request_id, ErrorCode::ShuttingDown);
        return Ok(ExitResult {
            shutting_down: false,
        });
    }
    let worker = match app.state::<AppState>().begin_shutdown() {
        Ok(worker) => worker,
        Err(error) => {
            app.state::<AppState>().exits.cancel(&request.request_id);
            return Err(cancelled(&app, request.request_id, error.code));
        }
    };
    let result = if let Some(worker) = &worker {
        worker.clone().shutdown().await
    } else {
        Ok(())
    };
    if let Err(error) = result {
        let state = app.state::<AppState>();
        state.start_recovery();
        state.exits.cancel(&request.request_id);
        let safe = cancelled(&app, request.request_id, error.code);
        if let Some(worker) = worker {
            let recovery_app = app.clone();
            tauri::async_runtime::spawn(async move {
                let recovered = tauri::async_runtime::spawn_blocking(move || worker.recover())
                    .await
                    .unwrap_or_else(|_| {
                        Err(AppError::new(
                            ErrorCode::InternalError,
                            "数据工作线程恢复失败。",
                        ))
                    });
                recovery_app.state::<AppState>().finish_recovery(recovered);
            });
        }
        return Err(safe);
    }
    app.state::<AppState>().complete_exit();
    app.exit(0);
    Ok(ExitResult {
        shutting_down: true,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ack(id: &str, ready: bool) -> ExitReadyRequest {
        ExitReadyRequest {
            data_generation_id: "generation".into(),
            request_id: id.into(),
            ready,
        }
    }

    #[test]
    fn duplicate_prepare_and_invalid_ack_do_not_consume_pending() {
        let exits = ExitCoordinator::default();
        let now = Instant::now();
        let id = exits.prepare(now).unwrap();
        assert!(uuid::Uuid::parse_str(&id).is_ok());
        assert!(exits.prepare(now).is_none());
        assert_eq!(
            exits
                .ready("other", "generation", &ack(&id, true), now)
                .unwrap_err()
                .code,
            ErrorCode::PermissionDenied
        );
        assert_eq!(
            exits
                .ready("main", "other-generation", &ack(&id, true), now)
                .unwrap_err()
                .code,
            ErrorCode::DataGenerationChanged
        );
        assert_eq!(
            exits
                .ready("main", "generation", &ack("wrong-id", true), now)
                .unwrap_err()
                .code,
            ErrorCode::InvalidInput
        );
        assert!(
            exits
                .ready("main", "generation", &ack(&id, true), now)
                .unwrap()
        );
        assert_eq!(
            exits
                .ready("main", "generation", &ack(&id, true), now)
                .unwrap_err()
                .code,
            ErrorCode::InvalidInput
        );
        assert!(!exits.expire(&id, now + PREPARE_TIMEOUT));
        exits.cancel(&id);
        assert_ne!(exits.prepare(now).unwrap(), id);
    }

    #[test]
    fn rejection_timeout_and_late_ack_cancel_and_allow_retry() {
        let exits = ExitCoordinator::default();
        let now = Instant::now();
        let id = exits.prepare(now).unwrap();
        assert!(
            !exits
                .ready("main", "generation", &ack(&id, false), now)
                .unwrap()
        );
        let second = exits.prepare(now).unwrap();
        assert_ne!(id, second);
        assert!(!exits.expire(&id, now + PREPARE_TIMEOUT));
        assert!(!exits.expire(&second, now + PREPARE_TIMEOUT - Duration::from_nanos(1)));
        assert!(exits.expire(&second, now + PREPARE_TIMEOUT));
        assert!(!exits.expire(&second, now + PREPARE_TIMEOUT));
        assert!(
            exits
                .ready(
                    "main",
                    "generation",
                    &ack(&second, true),
                    now + PREPARE_TIMEOUT
                )
                .is_err()
        );
        let third = exits.prepare(now).unwrap();
        assert!(
            !exits
                .ready(
                    "main",
                    "generation",
                    &ack(&third, true),
                    now + PREPARE_TIMEOUT
                )
                .unwrap()
        );
        assert!(exits.prepare(now).is_some());
    }

    #[test]
    fn ready_timeout_race_has_only_one_winner() {
        for _ in 0..32 {
            let exits = std::sync::Arc::new(ExitCoordinator::default());
            let now = Instant::now();
            let id = exits.prepare(now).unwrap();
            let barrier = std::sync::Arc::new(std::sync::Barrier::new(2));
            let timeout_exits = exits.clone();
            let timeout_barrier = barrier.clone();
            let timeout_id = id.clone();
            let timeout = std::thread::spawn(move || {
                timeout_barrier.wait();
                timeout_exits.expire(&timeout_id, now + PREPARE_TIMEOUT)
            });
            barrier.wait();
            let accepted = exits
                .ready(
                    "main",
                    "generation",
                    &ack(&id, true),
                    now + PREPARE_TIMEOUT - Duration::from_nanos(1),
                )
                .unwrap_or(false);
            let expired = timeout.join().unwrap();
            assert_ne!(accepted, expired);
            exits.cancel(&id);
            assert!(exits.prepare(now).is_some());
        }
    }

    #[test]
    fn lifecycle_wire_is_tagged_and_has_no_persistent_event_fields() {
        let event = AppLifecycleEvent {
            schema_version: SchemaVersion::V0_3,
            data_generation_id: "generation".into(),
            payload: AppLifecyclePayload::ExitPrepare {
                request_id: "id".into(),
            },
        };
        let value = serde_json::to_value(event).unwrap();
        assert_eq!(value["payload"]["kind"], "exit_prepare");
        assert!(value.get("event_seq").is_none());
        let error = AppError::new(ErrorCode::ShuttingDown, "退出取消。");
        let value = serde_json::to_value(AppLifecyclePayload::ExitCancelled {
            request_id: "id".into(),
            error,
        })
        .unwrap();
        assert_eq!(value["kind"], "exit_cancelled");
        assert_eq!(value["error"]["code"], "SHUTTING_DOWN");
    }
}
