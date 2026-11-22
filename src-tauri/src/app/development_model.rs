use std::{collections::HashMap, fs::File, io::Read, path::Path};

use uuid::Uuid;

use crate::domain::{
    contracts::{AppError, ErrorCode, ModelProfileInput, ModelProtocol},
    error::AppResult,
};

pub struct DevelopmentModel {
    pub profile: ModelProfileInput,
    pub api_key: String,
}

fn invalid() -> AppError {
    AppError::invalid(
        "development_model",
        "开发模型文件缺少允许字段、协议无效或格式不符合要求。",
    )
}

pub fn read() -> AppResult<DevelopmentModel> {
    if !cfg!(debug_assertions) {
        return Err(AppError::new(
            ErrorCode::CapabilityUnsupported,
            "此版本不读取开发模型文件。",
        ));
    }
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or_else(invalid)?
        .join(".env");
    let mut bytes = Vec::new();
    File::open(path)?.take(16_385).read_to_end(&mut bytes)?;
    if bytes.len() > 16_384 {
        return Err(invalid());
    }
    let text = std::str::from_utf8(&bytes).map_err(|_| invalid())?;
    parse(text)
}

fn parse(text: &str) -> AppResult<DevelopmentModel> {
    let mut fields = HashMap::new();
    for line in text.trim_start_matches('\u{feff}').lines() {
        let line = line.trim();
        if line.is_empty()
            || line.starts_with('#')
            || (line.starts_with('[') && line.ends_with(']'))
        {
            continue;
        }
        let Some((name, value)) = line.split_once('=') else {
            continue;
        };
        let name = name.trim();
        if !matches!(name, "BASE_URL" | "API_KEY" | "MODEL_NAME" | "ROUTER_TYPE") {
            continue;
        }
        let value = value.trim();
        let value = if (value.starts_with('"') && value.ends_with('"'))
            || (value.starts_with('\'') && value.ends_with('\''))
        {
            value
                .get(1..value.len().saturating_sub(1))
                .ok_or_else(invalid)?
        } else {
            value
        };
        if value.is_empty()
            || value.chars().any(char::is_control)
            || fields.insert(name, value).is_some()
        {
            return Err(invalid());
        }
    }
    let field = |name| fields.get(name).copied().ok_or_else(invalid);
    let protocol = match field("ROUTER_TYPE")? {
        "OpenAI Chat Completions" => ModelProtocol::OpenaiChatCompletions,
        "Anthropic Messages" => ModelProtocol::AnthropicMessages,
        "OpenAI Responses" => ModelProtocol::OpenaiResponses,
        _ => return Err(invalid()),
    };
    let api_key = field("API_KEY")?;
    if api_key.len() > 2048 {
        return Err(invalid());
    }
    Ok(DevelopmentModel {
        profile: ModelProfileInput {
            id: Uuid::now_v7().to_string(),
            name: "开发模型".into(),
            protocol,
            base_url: field("BASE_URL")?.into(),
            model_name: field("MODEL_NAME")?.into(),
        },
        api_key: api_key.into(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const CONFIG: &str = "[model.test]\nBASE_URL=https://model.invalid/v1\nAPI_KEY=synthetic-key\nMODEL_NAME=test-model\nROUTER_TYPE=\"OpenAI Chat Completions\"\n";

    #[test]
    fn accepts_literal_allowed_fields_and_ignores_section_and_unrelated_values() {
        let model = parse(&format!("{CONFIG}OTHER=$(do_not_execute)\n")).unwrap();
        assert_eq!(model.api_key, "synthetic-key");
        assert_eq!(model.profile.model_name, "test-model");
        assert_eq!(model.profile.protocol, ModelProtocol::OpenaiChatCompletions);
    }

    #[test]
    fn rejects_duplicates_missing_fields_and_unrecognized_protocol() {
        assert!(parse(&format!("{CONFIG}API_KEY=another-synthetic\n")).is_err());
        assert!(parse("API_KEY=synthetic-key").is_err());
        assert!(parse(&CONFIG.replace("OpenAI Chat Completions", "Execute Shell")).is_err());
    }
}
