use serde::de::DeserializeOwned;
use serde_json::Value;
use tauri::{Manager, State, WebviewWindow};

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
        lifecycle::request_exit(window.app_handle().clone());
        Ok(ExitResult {
            shutting_down: true,
        })
    })();
    result.into()
}
