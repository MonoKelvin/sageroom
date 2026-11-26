use serde::de::DeserializeOwned;
use serde_json::Value;
use tauri::{Emitter, Manager, State, WebviewWindow};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_dialog::DialogExt;

use super::{lifecycle, state::AppState};
use crate::domain::{contracts::*, error::AppResult};

fn trusted_window(window: &WebviewWindow) -> AppResult<()> {
    // 托盘面板是本应用创建的本地窗口，需要读取同一个本地数据源；
    // 其余窗口一律拒绝，避免外部页面借用 IPC。
    if !matches!(window.label(), "main" | crate::app::tray::POPUP_LABEL) {
        return Err(AppError::new(
            ErrorCode::PermissionDenied,
            "此窗口没有本地聊天权限。",
        ));
    }
    let url = window
        .url()
        .map_err(|_| AppError::new(ErrorCode::PermissionDenied, "无法确认本地窗口来源。"))?;
    let bundled = (url.scheme() == "tauri" && url.host_str() == Some("localhost"))
        || (matches!(url.scheme(), "http" | "https")
            && url.host_str() == Some("tauri.localhost")
            && url.port().is_none());
    let development = cfg!(debug_assertions)
        && url.scheme() == "http"
        && url.host_str() == Some("127.0.0.1")
        && url.port() == Some(1420);
    if !bundled && !development {
        return Err(AppError::new(
            ErrorCode::PermissionDenied,
            "仅本地应用界面可以使用此操作。",
        ));
    }
    Ok(())
}

fn decode<T: DeserializeOwned>(request: Value) -> AppResult<T> {
    serde_json::from_value(request)
        .map_err(|_| AppError::invalid("request", "请求字段、类型或枚举不符合当前合同。"))
}

// Tauri 的异步 State 参数要求 Result，业务错误仍由统一 envelope 承载。
#[tauri::command]
pub async fn app_get_snapshot(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<AppSnapshot>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.snapshot(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn chat_send(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<ChatSendResult>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.send_message(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn chat_recall(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<ChatRecallResult>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.recall_message(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn chat_resolve_quotes(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<Vec<ChatMessage>>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.resolve_quotes(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn chat_list(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<MessagePage>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.list_messages(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn chat_search(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<SearchPage>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state
            .worker()?
            .search
            .search(window.label().to_owned(), decode(request)?)
            .await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub fn cancel_search(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> ApiResponse<CancelSearchResult> {
    let result = (|| {
        trusted_window(&window)?;
        state
            .worker()?
            .search
            .cancel(window.label(), decode(request)?)
    })();
    result.into()
}

#[tauri::command]
pub async fn room_save(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<Room>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.save_room(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn appearance_save(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<Appearance>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.save_appearance(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn news_configuration_get(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<NewsConfigurationState>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.news_configuration(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn news_configuration_save(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<NewsConfigurationState>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.save_news_configuration(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn news_secret_status(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<NewsSecretStatus>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.news_secret_status(decode(request)?).await
    }.await;
    Ok(result.into())
}

#[tauri::command]
pub async fn news_secret_set(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<NewsSecretStatus>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.set_news_secret(decode(request)?).await
    }.await;
    Ok(result.into())
}

#[tauri::command]
pub async fn news_preview(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<NewsPreviewResponse>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.preview_news(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn open_external_link(
    window: WebviewWindow,
    request: Value,
) -> Result<ApiResponse<()>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let value: serde_json::Value = decode(request)?;
        let url = value
            .get("url")
            .and_then(|item| item.as_str())
            .ok_or_else(|| AppError::invalid("url", "缺少链接地址。"))?;
        let parsed = url::Url::parse(url)
            .map_err(|_| AppError::invalid("url", "链接格式无效。"))?;
        if !crate::app::external_links::is_external(&parsed) {
            return Err(AppError::invalid("url", "只允许打开外部网页链接。"));
        }
        crate::app::external_links::open_external(&parsed);
        Ok(())
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn data_directory_pick(
    window: WebviewWindow,
) -> Result<ApiResponse<Option<String>>, AppError> {
    let result = async {
        trusted_window(&window)?;
        Ok(window
            .app_handle()
            .dialog()
            .file()
            .blocking_pick_folder()
            .and_then(|path| path.into_path().ok()).and_then(|path| path.to_str().map(str::to_owned)))
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn data_directory_migrate(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<()>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let request: DataDirectoryMigrateRequest = decode(request)?;
        state.worker()?.call(move |database| database.check_generation(&request.data_generation_id)).await?;
        let app = window.app_handle();
        let config_dir = app.path().app_config_dir().map_err(|error| AppError::new(crate::domain::contracts::ErrorCode::IoError, error.to_string()))?;
        // 二次迁移必须从当前实际生效的根目录复制，而不是回退到默认目录。
        let current = crate::storage::data_root::configured_root(&config_dir)
            .or_else(|| app.path().app_local_data_dir().ok())
            .ok_or_else(|| AppError::new(crate::domain::contracts::ErrorCode::IoError, "无法确定当前数据目录。"))?;
        crate::storage::data_root::migrate(&current, &config_dir, std::path::Path::new(&request.target))
            .map_err(|message| AppError::new(crate::domain::contracts::ErrorCode::IoError, message))
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn data_directory_reset(
    window: WebviewWindow,
) -> Result<ApiResponse<()>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let app = window.app_handle();
        let config_dir = app.path().app_config_dir().map_err(|error| AppError::new(crate::domain::contracts::ErrorCode::IoError, error.to_string()))?;
        crate::storage::data_root::reset(&config_dir)
            .map_err(|message| AppError::new(crate::domain::contracts::ErrorCode::IoError, message))
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn ui_preferences_get(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<UiPreferences>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let request: UiPreferencesGetRequest = decode(request)?;
        state.worker()?.get_ui_preferences(request.data_generation_id).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn ui_preferences_save(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<()>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let request: UiPreferencesSaveRequest = decode(request)?;
        state.worker()?.save_ui_preferences(request.data_generation_id, request.preferences).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn tray_sync(
    window: WebviewWindow,
    state: State<'_, AppState>,
    tray: State<'_, crate::app::tray::TrayState>,
    request: Value,
) -> Result<ApiResponse<TraySyncState>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let request: TraySyncRequest = decode(request)?;
        state
            .worker()?
            .call(move |database| database.check_generation(&request.data_generation_id))
            .await?;
        let synced = tray.sync(request.flashing, request.conversation_count);
        // 会话被删空时，已经弹出的面板要立刻收掉，不能等到鼠标移出。
        if request.conversation_count == 0 {
            crate::app::tray::hide_popup(window.app_handle());
        }
        Ok(synced)
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn tray_open_main(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<TrayOpenResult>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let request: TrayOpenRequest = decode(request)?;
        let app = window.app_handle();
        // 先完成“打开主界面”这个用户明确意图，再做标已读：
        // 标已读依赖数据库 worker，若它排队或失败，不能拖住窗口唤回。
        crate::app::tray::hide_popup(app);
        let opened = crate::app::lifecycle::show_main(app);
        // 面板只为会话而存在，唤回后落在聊天页，避免停在用户上次浏览的其他页面。
        // 不靠 eval 注入 DOM 事件：事件可能早于主窗口 React 挂载而丢失，
        // 因此在 Rust 侧留下待领取意图，主窗口挂载或重新聚焦时主动读取。
        state.request_chat_open();
        let _ = app.emit("sageroom-open-chat", ());
        if let Some(through_seq) = request.through_seq {
            let _ = state
                .mark_inbox_read(InboxMarkReadRequest {
                    data_generation_id: request.data_generation_id,
                    client_request_id: uuid::Uuid::now_v7().to_string(),
                    conversation_id: request.conversation_id,
                    through_seq,
                })
                .await;
        }
        Ok(TrayOpenResult { opened })
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn consume_chat_open(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<ChatOpenState>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let _: ChatOpenRequest = decode(request)?;
        Ok(ChatOpenState { requested: state.consume_chat_open() })
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn autostart_status(
    window: WebviewWindow,
    request: Value,
) -> Result<ApiResponse<AutostartState>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let _: AutostartRequest = decode(request)?;
        let autolaunch = window.app_handle().autolaunch();
        let enabled = autolaunch
            .is_enabled()
            .map_err(|error| AppError::new(ErrorCode::IoError, error.to_string()))?;
        Ok(AutostartState { enabled })
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn autostart_set(
    window: WebviewWindow,
    request: Value,
) -> Result<ApiResponse<AutostartState>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let request: AutostartSetRequest = decode(request)?;
        let autolaunch = window.app_handle().autolaunch();
        if request.enabled {
            autolaunch
                .enable()
                .map_err(|error| AppError::new(ErrorCode::IoError, error.to_string()))?;
        } else {
            autolaunch
                .disable()
                .map_err(|error| AppError::new(ErrorCode::IoError, error.to_string()))?;
        }
        let enabled = autolaunch
            .is_enabled()
            .map_err(|error| AppError::new(ErrorCode::IoError, error.to_string()))?;
        Ok(AutostartState { enabled })
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn inbox_get(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<InboxSummary>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.inbox(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn inbox_mark_read(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<InboxSummary>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.mark_inbox_read(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn inbox_set_muted(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<InboxSummary>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.set_inbox_muted(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn global_configuration_get(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<GlobalConfiguration>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.global_configuration(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn global_configuration_save(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<GlobalConfiguration>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state
            .worker()?
            .save_global_configuration(decode(request)?)
            .await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn agent_list(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<Vec<AgentConfiguration>>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.list_agents(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn agent_delete(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<()>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.delete_agent(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn agent_save(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<AgentConfiguration>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.save_agent(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn agent_runtime_control(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<AgentRuntimeState>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.control_agent_runtime(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn user_profile_get(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<UserProfile>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.get_user_profile(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn user_profile_save(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<UserProfile>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.worker()?.save_user_profile(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn secret_set(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<SecretStatus>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.set_secret(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn secret_status(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<SecretStatus>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.secret_status(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn model_profile_test(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<ModelTestResult>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.test_model(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn development_model_import(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<GlobalConfiguration>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.import_development_model(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn avatar_import(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<Option<AvatarObject>>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let request: AvatarImportRequest = decode(request)?;
        let worker = state.worker()?;
        let generation = request.data_generation_id.clone();
        worker
            .call(move |database| database.check_generation(&generation))
            .await?;
        let _permit = state
            .avatar_gate
            .try_acquire()
            .map_err(|_| AppError::new(ErrorCode::Backpressure, "请先完成当前头像选择。"))?;
        let normalized = tauri::async_runtime::spawn_blocking(move || -> AppResult<_> {
            let selected = window
                .dialog()
                .file()
                .set_parent(&window)
                .set_title("选择头像")
                .add_filter("PNG / JPEG", &["png", "jpg", "jpeg"])
                .blocking_pick_file();
            let Some(selected) = selected else {
                return Ok(None);
            };
            let path = selected
                .into_path()
                .map_err(|_| AppError::invalid("avatar", "只能选择本地 PNG/JPEG 文件。"))?;
            crate::attachments::avatar::read_selection(&path).map(Some)
        })
        .await
        .map_err(|_| AppError::new(ErrorCode::InternalError, "头像读取未完成。"))??;
        let Some(normalized) = normalized else {
            return Ok(None);
        };
        worker
            .call(move |database| database.import_avatar(&request.data_generation_id, normalized))
            .await
            .map(Some)
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn avatar_read(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<AvatarData>, AppError> {
    let result = async {
        trusted_window(&window)?;
        let request: AvatarReadRequest = decode(request)?;
        state
            .worker()?
            .call(move |database| {
                database.read_avatar(&request.data_generation_id, &request.avatar_id)
            })
            .await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub fn app_request_exit(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> ApiResponse<ExitResult> {
    let result = (|| {
        trusted_window(&window)?;
        let request: ExitRequest = decode(request)?;
        if request
            .data_generation_id
            .is_some_and(|generation| generation != state.generation)
        {
            return Err(AppError::new(
                ErrorCode::DataGenerationChanged,
                "应用运行世代已改变，请重新确认退出。",
            ));
        }
        lifecycle::prepare_exit(window.app_handle().clone())
    })();
    result.into()
}

#[tauri::command]
pub async fn experience_list(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<Vec<ExperienceEntry>>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.experience_list(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn experience_add(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<ExperienceEntry>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.experience_add(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn experience_update(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<ExperienceEntry>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.experience_update(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn experience_delete(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<Vec<ExperienceEntry>>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.experience_delete(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn experience_prune(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<Vec<ExperienceEntry>>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.experience_prune(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn model_profile_list(
    window: WebviewWindow,
    state: State<'_, AppState>,
    request: Value,
) -> Result<ApiResponse<ModelListResult>, AppError> {
    let result = async {
        trusted_window(&window)?;
        state.list_models(decode(request)?).await
    }
    .await;
    Ok(result.into())
}

#[tauri::command]
pub async fn app_exit_ready(
    window: WebviewWindow,
    request: Value,
) -> Result<ApiResponse<ExitResult>, AppError> {
    let result = async {
        trusted_window(&window)?;
        lifecycle::exit_ready(
            window.app_handle().clone(),
            window.label(),
            decode(request)?,
        )
        .await
    }
    .await;
    Ok(result.into())
}

/// 读取系统剪贴板纯文本。
/// WebView2 里 navigator.clipboard.readText 需要额外运行时授权，常被拒绝；
/// 走原生剪贴板可避免权限提示，也与系统右键菜单行为一致。
#[tauri::command]
pub async fn clipboard_read_text(window: WebviewWindow) -> Result<ApiResponse<String>, AppError> {
    let result = async {
        trusted_window(&window)?;
        read_clipboard_text()
    }
    .await;
    Ok(result.into())
}

#[cfg(windows)]
fn read_clipboard_text() -> AppResult<String> {
    use windows_sys::Win32::System::DataExchange::{
        CloseClipboard, GetClipboardData, IsClipboardFormatAvailable, OpenClipboard,
    };
    use windows_sys::Win32::System::Memory::{GlobalLock, GlobalUnlock};
    use windows_sys::Win32::System::Ole::CF_UNICODETEXT;

    // 剪贴板可能被其他进程短暂占用，最多重试若干次。
    let mut opened = false;
    for _ in 0..8 {
        if unsafe { OpenClipboard(std::ptr::null_mut()) } != 0 {
            opened = true;
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(15));
    }
    if !opened {
        return Err(AppError::new(
            ErrorCode::CapabilityUnsupported,
            "剪贴板正被其他程序占用，请稍后重试。",
        ));
    }

    // 无论读取是否成功都要关闭剪贴板。
    let read = (|| -> AppResult<String> {
        if unsafe { IsClipboardFormatAvailable(CF_UNICODETEXT as u32) } == 0 {
            return Ok(String::new());
        }
        let handle = unsafe { GetClipboardData(CF_UNICODETEXT as u32) };
        if handle.is_null() {
            return Ok(String::new());
        }
        let pointer = unsafe { GlobalLock(handle) } as *const u16;
        if pointer.is_null() {
            return Ok(String::new());
        }
        let mut length = 0usize;
        unsafe {
            while *pointer.add(length) != 0 {
                length += 1;
            }
        }
        let text = unsafe { String::from_utf16_lossy(std::slice::from_raw_parts(pointer, length)) };
        unsafe { GlobalUnlock(handle) };
        Ok(text)
    })();

    unsafe { CloseClipboard() };
    read
}

#[cfg(not(windows))]
fn read_clipboard_text() -> AppResult<String> {
    Err(AppError::new(
        ErrorCode::CapabilityUnsupported,
        "当前平台暂不支持读取剪贴板。",
    ))
}
