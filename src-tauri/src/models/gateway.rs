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
    chat::{ChatMessage, ChatRequest, ChatResponse, ContentPart, ReasoningEffort, StopReason},
    resolver::{AuthData, Endpoint},
};
use tokio::sync::Semaphore;
use tokio_util::sync::CancellationToken;

use crate::domain::{
    contracts::{AppError, ErrorCode, ModelProfile, ModelTestResult, Retryability},
    error::AppResult,
};

use super::protocols::{TEST_PROMPT, adapter, prepare, prepare_chat};

const DEADLINE: Duration = Duration::from_secs(15);
const CHAT_DEADLINE: Duration = Duration::from_secs(90);
const MAX_CONCURRENT: usize = 2;
const MAX_CHAT_CONCURRENT: usize = 4;
const MAX_PROCESS_CALLS: u32 = 20;
static PROCESS_LIMITS: OnceLock<Arc<Limits>> = OnceLock::new();

struct Limits {
    permits: Semaphore,
    chat_permits: Semaphore,
    calls: AtomicU32,
}

impl Limits {
    fn new() -> Self {
        Self {
            permits: Semaphore::new(MAX_CONCURRENT),
            chat_permits: Semaphore::new(MAX_CHAT_CONCURRENT),
            calls: AtomicU32::new(0),
        }
    }
}

// Raw model output must be validated before crossing IPC.
pub struct ChatReply {
    pub text: String,
    pub usage_input_tokens: Option<u32>,
    pub usage_output_tokens: Option<u32>,
}

impl std::fmt::Debug for ChatReply {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ChatReply")
            .field("text_bytes", &self.text.len())
            .field("usage_input_tokens", &self.usage_input_tokens)
            .field("usage_output_tokens", &self.usage_output_tokens)
            .finish()
    }
}

pub struct ModelGateway {
    client: Client,
    /// 仅用于模型列表这类 SDK 未覆盖的简单 GET 请求。
    http: reqwest::Client,
    limits: Arc<Limits>,
    deadline: Duration,
    chat_deadline: Duration,
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
            .connect_timeout(Duration::from_secs(5))
            .timeout(CHAT_DEADLINE)
            .connection_verbose(false)
            .no_proxy()
            .resolve("localhost", SocketAddr::from((Ipv4Addr::LOCALHOST, 0)))
            .no_gzip()
            .no_brotli()
            .no_deflate()
            .no_zstd()
            .pool_max_idle_per_host(0)
            .build()
            .map_err(|_| safe_error(ErrorCode::InternalError, "无法初始化模型连接。", false))?;
        let client = Client::builder()
            .with_reqwest(transport.clone())
            .build()
            .map_err(|_| safe_error(ErrorCode::InternalError, "无法初始化模型 SDK。", false))?;
        Ok(Self {
            client,
            http: transport,
            limits,
            deadline,
            chat_deadline: CHAT_DEADLINE,
        })
    }

    /// 默认关闭思考，供连接测试与普通调用使用。
    pub async fn chat(
        &self,
        profile: ModelProfile,
        api_key: String,
        system: String,
        context: String,
        cancellation: CancellationToken,
    ) -> AppResult<ChatReply> {
        self.chat_with_reasoning(profile, api_key, system, context, Some(ReasoningEffort::Zero), cancellation).await
    }

    /// 工具助手不指定推理强度，使用模型服务的默认行为。
    pub async fn chat_with_reasoning(
        &self,
        profile: ModelProfile,
        api_key: String,
        system: String,
        context: String,
        reasoning: Option<ReasoningEffort>,
        cancellation: CancellationToken,
    ) -> AppResult<ChatReply> {
        if cancellation.is_cancelled() {
            return Err(chat_cancelled(false));
        }
        let (endpoint, options) = prepare_chat(&profile, &api_key, &system, &context, reasoning)?;
        let _permit = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(chat_cancelled(false)),
            permit = self.limits.chat_permits.acquire() => permit.map_err(|_| safe_error(
                ErrorCode::ShuttingDown, "模型调用队列已关闭。", false,
            ))?,
        };
        // Queue time is excluded from the request deadline.
        let deadline = tokio::time::Instant::now() + self.chat_deadline;
        if cancellation.is_cancelled() {
            return Err(chat_cancelled(false));
        }
        let target = ServiceTarget {
            endpoint: Endpoint::from_owned(endpoint),
            auth: AuthData::Key(api_key.clone()),
            model: ModelIden::new(adapter(&profile.protocol), profile.model_name),
        };
        let request = ChatRequest::new(vec![
            ChatMessage::system(system),
            ChatMessage::user(context),
        ]);
        let mut sdk_call = pin!(self.client.exec_chat(target, request, Some(&options)));
        let no_logs = tracing::Dispatch::new(tracing::subscriber::NoSubscriber::default());
        let call = poll_fn(|cx| {
            tracing::dispatcher::with_default(&no_logs, || sdk_call.as_mut().poll(cx))
        });
        let response = tokio::select! {
            biased;
            _ = cancellation.cancelled() => return Err(chat_cancelled(true)),
            _ = tokio::time::sleep_until(deadline) => return Err(safe_error(
                ErrorCode::IoError, "模型调用超时，服务端可能仍在处理请求。", true,
            )),
            response = call => response.map_err(sdk_error)?,
        };
        let text = chat_text(&response, &api_key)?;
        Ok(ChatReply {
            text,
            usage_input_tokens: usage_counter(response.usage.prompt_tokens),
            usage_output_tokens: usage_counter(response.usage.completion_tokens),
        })
    }

    /// 通过已配置凭据调用服务端的模型列表接口，返回可用的模型名称。
    ///
    /// OpenAI Chat Completions / Responses：`GET {base_url}/models`，Bearer 认证。
    /// Anthropic Messages：`GET {base_url}/models`，x-api-key + anthropic-version，
    /// 并按 `has_more` / `last_id` 翻页（`after_id`）。不读取或回显密钥。
    pub async fn list_models(
        &self,
        profile: ModelProfile,
        api_key: String,
        cancellation: CancellationToken,
    ) -> AppResult<Vec<String>> {
        use crate::domain::contracts::ModelProtocol;

        if cancellation.is_cancelled() {
            return Err(chat_cancelled(false));
        }
        // endpoint() 已校验协议/主机并保证以 '/' 结尾。
        let base = super::protocols::endpoint(&profile.base_url)?;
        let url = format!("{base}models");
        let is_anthropic = matches!(profile.protocol, ModelProtocol::AnthropicMessages);
        let mut models: Vec<String> = Vec::new();
        let mut after: Option<String> = None;

        loop {
            let mut url = url::Url::parse(&url)
                .map_err(|_| list_error("模型列表地址无效。"))?;
            if let Some(cursor) = &after {
                url.query_pairs_mut().append_pair("after_id", cursor);
            }
            let mut request = self.http.get(url).timeout(self.deadline);
            if is_anthropic {
                request = request.header("x-api-key", &api_key)
                    .header("anthropic-version", "2023-06-01");
            } else {
                request = request.bearer_auth(&api_key);
            }
            let response = tokio::select! {
                _ = cancellation.cancelled() => return Err(chat_cancelled(false)),
                result = request.send() => result.map_err(|error| {
                    list_error(&format!("连接模型服务失败：{error}"))
                })?,
            };
            let status = response.status();
            if !status.is_success() {
                return Err(list_error(&format!(
                    "模型服务拒绝了列表请求（HTTP {}），请检查服务地址与凭据。",
                    status.as_u16()
                )));
            }
            let body: serde_json::Value = response.json().await
                .map_err(|_| list_error("模型列表响应格式无效。"))?;
            let values = body.get("data").and_then(|value| value.as_array())
                .ok_or_else(|| list_error("模型列表响应缺少 data 字段。"))?;
            for item in values {
                if let Some(id) = item.get("id").and_then(|value| value.as_str()) {
                    let id = id.trim();
                    // 过滤空值与疑似密钥的回显，避免把敏感信息带到界面。
                    if !id.is_empty() && id != api_key && !id.contains(&api_key) {
                        models.push(id.to_owned());
                    }
                }
            }
            let has_more = body.get("has_more").and_then(|value| value.as_bool())
                .unwrap_or(false);
            let next = body.get("last_id").and_then(|value| value.as_str())
                .map(str::to_owned);
            if !is_anthropic || !has_more {
                break;
            }
            match next {
                Some(cursor) if cursor != after.as_deref().unwrap_or_default() => after = Some(cursor),
                _ => break,
            }
        }

        models.sort();
        models.dedup();
        if models.is_empty() {
            return Err(list_error("当前服务未返回任何可用模型。"));
        }
        Ok(models)
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

fn chat_text(response: &ChatResponse, api_key: &str) -> AppResult<String> {
    if !response.content.tool_calls().is_empty()
        || matches!(response.stop_reason, Some(StopReason::ToolCall(_)))
        || response
            .content
            .iter()
            .any(|part| !matches!(part, ContentPart::Text(_)))
    {
        return Err(safe_error(
            ErrorCode::CapabilityUnsupported,
            "模型调用仅接受纯文本，不执行工具或其他内容。",
            true,
        ));
    }
    if !matches!(
        response.stop_reason,
        Some(StopReason::Completed(_) | StopReason::StopSequence(_))
    ) {
        return Err(safe_error(
            ErrorCode::IoError,
            "模型响应被截断、过滤或未正常完成。",
            true,
        ));
    }
    let text = response
        .content
        .joined_texts()
        .ok_or_else(|| safe_error(ErrorCode::IoError, "模型未返回有效的普通文本响应。", true))?;
    if text.trim().is_empty() || text.contains(api_key) {
        return Err(safe_error(
            ErrorCode::IoError,
            "模型未返回可安全处理的普通文本响应。",
            true,
        ));
    }
    Ok(text)
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
                "模型调用未完成，请检查连接、协议和模型配置。",
            ),
        },
    };
    safe_error(code, message, true)
}

fn chat_cancelled(charged: bool) -> AppError {
    safe_error(ErrorCode::ShuttingDown, "模型调用已取消。", charged)
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

/// 模型列表读取失败：允许动态消息（调用方需自行避免包含密钥），不产生费用。
fn list_error(message: &str) -> AppError {
    let mut error = AppError::new(ErrorCode::CapabilityUnsupported, message);
    error.retryability = Retryability::Never;
    error.may_have_been_charged = false;
    error
}

#[cfg(test)]
#[path = "tests.rs"]
mod tests;
