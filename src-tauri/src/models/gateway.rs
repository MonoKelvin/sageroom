use std::{
    future::{Future, poll_fn},
    net::{Ipv4Addr, SocketAddr},
    pin::pin,
    sync::{
        Arc, OnceLock,
        atomic::{AtomicU32, Ordering},
    },
    time::{Duration, Instant},
};

use genai::{
    Client, ModelIden, ServiceTarget,
    chat::{ChatRequest, ChatResponse, StopReason},
    resolver::{AuthData, Endpoint},
};
use tokio::sync::Semaphore;
use tokio_util::sync::CancellationToken;

use crate::domain::{
    contracts::{AppError, ErrorCode, ModelProfile, ModelTestResult, Retryability},
    error::AppResult,
};

use super::protocols::{TEST_PROMPT, adapter, prepare};

const DEADLINE: Duration = Duration::from_secs(15);
const MAX_CONCURRENT: usize = 2;
const MAX_PROCESS_CALLS: u32 = 20;
static PROCESS_LIMITS: OnceLock<Arc<Limits>> = OnceLock::new();

struct Limits {
    permits: Semaphore,
    calls: AtomicU32,
}

impl Limits {
    fn new() -> Self {
        Self {
            permits: Semaphore::new(MAX_CONCURRENT),
            calls: AtomicU32::new(0),
        }
    }
}

pub struct ModelGateway {
    client: Client,
    limits: Arc<Limits>,
    deadline: Duration,
}

impl ModelGateway {
    pub fn new() -> AppResult<Self> {
        Self::build(
            DEADLINE,
            PROCESS_LIMITS
                .get_or_init(|| Arc::new(Limits::new()))
                .clone(),
        )
    }

    fn build(deadline: Duration, limits: Arc<Limits>) -> AppResult<Self> {
        let transport = reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .retry(reqwest::retry::never())
            .connect_timeout(Duration::from_secs(5).min(deadline))
            .timeout(deadline)
            .connection_verbose(false)
            .no_proxy()
            .resolve("localhost", SocketAddr::from((Ipv4Addr::LOCALHOST, 0)))
            .no_gzip()
            .no_brotli()
            .no_deflate()
            .no_zstd()
            .pool_max_idle_per_host(0)
            .build()
            .map_err(|_| safe_error(ErrorCode::InternalError, "无法初始化模型连接测试。", false))?;
        let client = Client::builder()
            .with_reqwest(transport)
            .build()
            .map_err(|_| safe_error(ErrorCode::InternalError, "无法初始化模型 SDK。", false))?;
        Ok(Self {
            client,
            limits,
            deadline,
        })
    }

    pub async fn test(
        &self,
        profile: ModelProfile,
        api_key: String,
        shutdown: CancellationToken,
    ) -> AppResult<ModelTestResult> {
        let start = Instant::now();
        if shutdown.is_cancelled() {
            return Err(cancelled(false));
        }
        let (endpoint, options) = prepare(&profile, &api_key)?;
        let _permit = self.limits.permits.try_acquire().map_err(|_| {
            safe_error(
                ErrorCode::Backpressure,
                "最多同时执行两个模型连接测试。",
                false,
            )
        })?;
        if shutdown.is_cancelled() {
            return Err(cancelled(false));
        }
        self.limits
            .calls
            .fetch_update(Ordering::Relaxed, Ordering::Relaxed, |calls| {
                (calls < MAX_PROCESS_CALLS).then_some(calls + 1)
            })
            .map_err(|_| {
                safe_error(
                    ErrorCode::Backpressure,
                    "本次应用运行已达到二十次模型连接测试上限。",
                    false,
                )
            })?;
        let target = ServiceTarget {
            endpoint: Endpoint::from_owned(endpoint),
            auth: AuthData::Key(api_key),
            model: ModelIden::new(adapter(&profile.protocol), profile.model_name.clone()),
        };
        let request = ChatRequest::from_user(TEST_PROMPT);
        let mut sdk_call = pin!(self.client.exec_chat(target, request, Some(&options)));
        let no_logs = tracing::Dispatch::new(tracing::subscriber::NoSubscriber::default());
        let call = poll_fn(|cx| {
            tracing::dispatcher::with_default(&no_logs, || sdk_call.as_mut().poll(cx))
        });
        let deadline = tokio::time::Instant::from_std(start + self.deadline);
        let response = tokio::select! {
            biased;
            _ = shutdown.cancelled() => return Err(cancelled(true)),
            _ = tokio::time::sleep_until(deadline) => return Err(safe_error(
                ErrorCode::IoError, "模型连接测试超时，服务端可能仍在处理请求。", true,
            )),
            response = call => response.map_err(sdk_error)?,
        };
        validate_response(&response)?;
        Ok(ModelTestResult {
            profile_id: profile.id,
            revision: profile.revision,
            protocol: profile.protocol,
            available: true,
            usage_input_tokens: usage_counter(response.usage.prompt_tokens),
            usage_output_tokens: usage_counter(response.usage.completion_tokens),
            elapsed_ms: u32::try_from(start.elapsed().as_millis()).unwrap_or(u32::MAX),
        })
    }
}

fn validate_response(response: &ChatResponse) -> AppResult<()> {
    if !response.content.tool_calls().is_empty()
        || matches!(response.stop_reason, Some(StopReason::ToolCall(_)))
    {
        return Err(safe_error(
            ErrorCode::CapabilityUnsupported,
            "连接测试不执行模型返回的工具请求。",
            true,
        ));
    }
    if matches!(
        response.stop_reason,
        Some(StopReason::Other(_) | StopReason::ContentFilter(_))
    ) || !response
        .content
        .texts()
        .iter()
        .any(|text| !text.trim().is_empty())
    {
        return Err(safe_error(
            ErrorCode::IoError,
            "模型未返回有效的普通文本测试响应。",
            true,
        ));
    }
    Ok(())
}

fn usage_counter(value: Option<i32>) -> Option<u32> {
    value.and_then(|count| u32::try_from(count).ok())
}

fn sdk_error(error: genai::Error) -> AppError {
    let (code, message) = match error.status().map(|status| status.as_u16()) {
        Some(401 | 403) => (ErrorCode::PermissionDenied, "模型服务拒绝凭据或访问权限。"),
        Some(404) => (
            ErrorCode::CapabilityUnsupported,
            "模型服务未找到所选协议端点或模型。",
        ),
        Some(429) => (
            ErrorCode::Backpressure,
            "模型服务拒绝请求，请检查服务端限额。",
        ),
        Some(400 | 422) => (
            ErrorCode::CapabilityUnsupported,
            "模型服务不接受当前协议或参数。",
        ),
        _ => match error {
            genai::Error::AdapterNotSupported { .. } => (
                ErrorCode::CapabilityUnsupported,
                "模型 SDK 不支持当前协议能力。",
            ),
            _ => (
                ErrorCode::IoError,
                "模型连接测试未完成，请检查连接、协议和模型配置。",
            ),
        },
    };
    safe_error(code, message, true)
}

fn cancelled(charged: bool) -> AppError {
    safe_error(ErrorCode::ShuttingDown, "模型连接测试已取消。", charged)
}

fn safe_error(code: ErrorCode, message: &'static str, charged: bool) -> AppError {
    let mut error = AppError::new(code, message);
    error.retryability = Retryability::Never;
    error.may_have_been_charged = charged;
    error
}

#[cfg(test)]
#[path = "tests.rs"]
mod tests;
