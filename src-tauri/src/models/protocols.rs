use genai::{
    adapter::AdapterKind,
    chat::{ChatOptions, ReasoningEffort},
};

use crate::domain::{
    contracts::{AppError, ErrorCode, MODEL_INPUT_BUDGET, MODEL_MAX_OUTPUT_TOKENS, MODEL_TEMPERATURE, MODEL_TOP_P, ModelProfile, ModelProtocol},
    error::{AppResult, parse_counter, validate_id},
};

pub(super) const TEST_PROMPT: &str = "Reply only with OK.";
const MAX_INPUT_BYTES: usize = 64;
const INPUT_OVERHEAD: usize = 128;
const MAX_OUTPUT_TOKENS: u32 = 64;
const MAX_CHAT_OUTPUT_TOKENS: u32 = 4096;

pub(super) fn adapter(protocol: &ModelProtocol) -> AdapterKind {
    match protocol {
        ModelProtocol::OpenaiChatCompletions => AdapterKind::OpenAI,
        ModelProtocol::AnthropicMessages => AdapterKind::Anthropic,
        ModelProtocol::OpenaiResponses => AdapterKind::OpenAIResp,
    }
}

pub(super) fn prepare(profile: &ModelProfile, api_key: &str) -> AppResult<(String, ChatOptions)> {
    let endpoint = validate_common(profile, api_key)?;
    if TEST_PROMPT.len() > MAX_INPUT_BYTES
        || TEST_PROMPT.len() + INPUT_OVERHEAD > MODEL_INPUT_BUDGET.min(256) as usize
    {
        return Err(AppError::invalid("parameters", "连接测试预算无效。"));
    }
    Ok((endpoint, options(MAX_OUTPUT_TOKENS, ReasoningEffort::Zero)))
}

pub(super) fn prepare_chat(
    profile: &ModelProfile,
    api_key: &str,
    system: &str,
    context: &str,
    reasoning: ReasoningEffort,
) -> AppResult<(String, ChatOptions)> {
    let endpoint = validate_common(profile, api_key)?;
    if system.trim().is_empty() || context.trim().is_empty() {
        return Err(AppError::invalid(
            "context",
            "模型调用需要系统提示与上下文。",
        ));
    }
    // The runtime owns context assembly. This UTF-8 byte estimate is deliberately
    // conservative (at least bytes / 2), not a claim of exact model tokenization.
    // 通用角色指令是固定开销，不挤占「输入预算」；预算只衡量上下文消息。
    let ceiling = MODEL_INPUT_BUDGET as usize * 2;
    if context.len() > ceiling {
        return Err(AppError::invalid("context", "模型输入超过保守上下文预算。"));
    }
    Ok((endpoint, options(MAX_CHAT_OUTPUT_TOKENS, reasoning)))
}

fn validate_common(profile: &ModelProfile, api_key: &str) -> AppResult<String> {
    validate_id(&profile.id, "profile_id")?;
    parse_counter(&profile.revision, "revision")?;
    if profile.model_name.trim().is_empty()
        || profile.model_name.chars().count() > 200
        || profile.model_name.chars().any(char::is_control)
        || profile.model_name.trim() != profile.model_name
    {
        return Err(AppError::invalid("model_name", "模型名称无效。"));
    }
    if profile.model_name.contains("::")
        || ReasoningEffort::from_model_name(&profile.model_name)
            .0
            .is_some()
    {
        return Err(AppError::new(
            ErrorCode::CapabilityUnsupported,
            "模型调用不接受 SDK 命名空间或隐式推理后缀，请使用服务端原始模型名称。",
        ));
    }
    if api_key.is_empty()
        || api_key.len() > 8192
        || !api_key.bytes().all(|byte| (0x21..=0x7e).contains(&byte))
    {
        return Err(AppError::invalid("api_key", "模型凭据为空或格式无效。"));
    }
    endpoint(&profile.base_url)
}

fn options(max_output_tokens: u32, reasoning: ReasoningEffort) -> ChatOptions {
    ChatOptions::default()
        .with_max_tokens(MODEL_MAX_OUTPUT_TOKENS.min(max_output_tokens))
        .with_capture_raw_body(false)
        .with_capture_reasoning_content(false)
        .with_reasoning_effort(reasoning)
        .with_extra_body(serde_json::json!({
            "temperature": MODEL_TEMPERATURE,
            "top_p": MODEL_TOP_P,
        }))
}

pub(super) fn endpoint(base_url: &str) -> AppResult<String> {
    if base_url.is_empty()
        || base_url.chars().count() > 2048
        || base_url.chars().any(char::is_control)
        || base_url.trim() != base_url
    {
        return Err(AppError::invalid("base_url", "模型地址格式无效。"));
    }
    let mut url = url::Url::parse(base_url)
        .map_err(|_| AppError::invalid("base_url", "模型地址格式无效。"))?;
    let has_userinfo = base_url.split_once("://").is_some_and(|(_, rest)| {
        rest.split(['/', '?', '#'])
            .next()
            .is_some_and(|authority| authority.contains('@'))
    });
    if !matches!(url.scheme(), "https" | "http")
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || has_userinfo
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err(AppError::invalid(
            "base_url",
            "模型地址只接受不含凭据、查询或片段的 HTTP(S) 地址。",
        ));
    }
    if url.scheme() == "http"
        && !matches!(url.host_str(), Some("127.0.0.1" | "localhost" | "[::1]"))
    {
        return Err(AppError::invalid(
            "base_url",
            "非本机模型地址必须使用 HTTPS。",
        ));
    }
    if !url.path().ends_with('/') {
        let path = format!("{}/", url.path());
        url.set_path(&path);
    }
    Ok(url.into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn endpoint_boundary_and_trailing_slash() {
        for input in [
            "http://127.0.0.1:1234/v1",
            "http://localhost:1234/v1/",
            "http://[::1]:1234/v1",
            "https://example.invalid/custom",
        ] {
            let actual = endpoint(input).unwrap();
            assert!(actual.ends_with('/'));
        }
        for input in [
            "http://example.invalid/v1",
            "http://localhost.example.invalid/v1",
            "https://user:secret@example.invalid/v1",
            "https://@example.invalid/v1",
            "https://example.invalid/v1?key=synthetic",
            "https://example.invalid/v1#synthetic",
            "file:///tmp/model",
            "ftp://example.invalid/v1",
            " https://example.invalid/v1",
            "https://example.invalid/v1\n",
        ] {
            let error = endpoint(input).unwrap_err();
            assert_eq!(error.code, ErrorCode::InvalidInput);
            assert!(!error.may_have_been_charged);
            assert!(!error.message.contains("synthetic"));
        }
    }

    #[test]
    fn routing_is_explicit() {
        assert_eq!(
            adapter(&ModelProtocol::OpenaiChatCompletions),
            AdapterKind::OpenAI
        );
        assert_eq!(
            adapter(&ModelProtocol::OpenaiResponses),
            AdapterKind::OpenAIResp
        );
        assert_eq!(
            adapter(&ModelProtocol::AnthropicMessages),
            AdapterKind::Anthropic
        );
    }
}
