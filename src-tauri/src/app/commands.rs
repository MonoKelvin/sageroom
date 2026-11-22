use serde::de::DeserializeOwned;
use serde_json::Value;
use tauri::{Manager, State, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

use super::{lifecycle, state::AppState};
use crate::domain::{contracts::*, error::AppResult};

fn trusted_window(window: &WebviewWindow) -> AppResult<()> {
    if window.label() != "main" {
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
