use std::collections::{BTreeMap, HashSet};

use rusqlite::{Connection, OptionalExtension, Transaction, params};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{
    chat::{load_messages, record_event, record_request, replay_request},
    database::{Database, fingerprint},
};
use crate::domain::{
    contracts::*,
    error::{AppResult, now_ms, parse_counter, validate_id},
};

/// 通用角色指令：构建期内嵌，运行时强制注入 system prompt，用户 skill 无法覆盖。
pub const BASE_SKILL: &str = include_str!("../../../agent/SKILL.md");

#[derive(Clone, Deserialize)]
pub struct DefaultAgentSpec {
    pub key: String,
    pub display_name: String,
    pub gender_description: String,
    pub language_style: String,
    pub dimensions: PersonaDimensions,
}

#[derive(Deserialize)]
struct DefaultAgentFile {
    agents: Vec<DefaultAgentSpec>,
}

/// 内置默认智能体的单一数据源：`agent/agents.json`。
pub fn default_agent_specs() -> Vec<DefaultAgentSpec> {
    serde_json::from_str::<DefaultAgentFile>(include_str!("../../../agent/agents.json"))
        .expect("内置默认智能体配置必须有效")
        .agents
}

pub fn default_dimensions() -> PersonaDimensions {
    PersonaDimensions {
        professional: 40,
        formal: 20,
        casual: 70,
        humor: 40,
        direct: 50,
        empathy: 60,
        social_energy: 50,
        activity: 50,
    }
}

pub fn seed_configuration(conn: &Connection) -> AppResult<()> {
    conn.execute(
        "INSERT INTO global_configuration VALUES (1, 1, ?1)",
        ["{}"],
    )?;
    let persona = PersonaPreset {
        id: "natural-member".into(),
        name: "自然成员".into(),
        language_style: "自然、简短、有具体语境".into(),
        skill: String::new(),
        dimensions: default_dimensions(),
        revision: 1_i64.into(),
    };
    conn.execute(
        "INSERT INTO persona_presets VALUES (?1, 1, ?2)",
        params![persona.id, serde_json::to_string(&persona)?],
    )?;
    let mut statement = conn.prepare(
        "SELECT id, display_name, avatar_id FROM participants WHERE kind = 'agent'",
    )?;
    let agents = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
            ))
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    let specs = default_agent_specs();
    for (id, name, avatar_id) in agents {
        let spec = specs.iter().find(|candidate| candidate.display_name == name);
        let config = AgentConfiguration {
            agent_id: id,
            revision: 1_i64.into(),
            dimensions: spec.map(|item| item.dimensions.clone()).unwrap_or_else(default_dimensions),
            display_name: name,
            gender_description: spec.map(|item| item.gender_description.clone()),
            language_style: spec.map(|item| item.language_style.clone()).unwrap_or_else(|| persona.language_style.clone()),
            skill: String::new(),
            avatar_id,
            agent_type: AgentType::Social,
            model: None,
        };
        conn.execute(
            "INSERT INTO agent_configurations VALUES (?1, 1)",
            [&config.agent_id],
        )?;
        conn.execute(
            "INSERT INTO agent_config_versions VALUES (?1, 1, ?2)",
            params![config.agent_id, serde_json::to_string(&config)?],
        )?;
    }
    Ok(())
}

fn bounded(value: &str, field: &str, limit: usize, required: bool) -> AppResult<()> {
    if value.len() > limit * 4
        || value.chars().count() > limit
        || (required && value.trim().is_empty())
        || value.contains('\0')
    {
        return Err(AppError::invalid(
            field,
            "内容为空、超过长度上限或含无效字符。",
        ));
    }
    Ok(())
}

/// 昵称宽度：一个中文（或全角/emoji）算 2，英文/数字算 1，总上限 16。
const DISPLAY_NAME_WIDTH_LIMIT: usize = 16;

fn char_display_width(character: char) -> usize {
    let code = character as u32;
    if matches!(
        code,
        0x1100..=0x115F
            | 0x2E80..=0xA4CF
            | 0xAC00..=0xD7A3
            | 0xF900..=0xFAFF
            | 0xFE10..=0xFE19
            | 0xFE30..=0xFE6F
            | 0xFF00..=0xFF60
            | 0xFFE0..=0xFFE6
            | 0x1F300..=0x1FAFF
            | 0x20000..=0x3FFFD
    ) {
        2
    } else {
        1
    }
}

fn display_width(value: &str) -> usize {
    value.chars().map(char_display_width).sum()
}

fn bounded_display_name(value: &str, field: &str) -> AppResult<()> {
    if value.len() > DISPLAY_NAME_WIDTH_LIMIT * 4
        || display_width(value) > DISPLAY_NAME_WIDTH_LIMIT
        || value.trim().is_empty()
        || value.contains('\0')
    {
        return Err(AppError::invalid(
            field,
            "昵称不能为空或含无效字符，且最多 8 个中文或 16 个英文字符。",
        ));
    }
    Ok(())
}

fn validate_profile(value: &ModelProfileInput) -> AppResult<()> {
    validate_id(&value.id, "profile_id")?;
    bounded(&value.name, "name", 80, true)?;
    bounded(&value.model_name, "model_name", 200, false)?;
    bounded(&value.base_url, "base_url", 2048, false)?;
    if value.base_url.is_empty() {
        return Ok(());
    }
    if value.base_url.chars().any(char::is_control) || value.base_url.trim() != value.base_url {
        return Err(AppError::invalid(
            "base_url",
            "模型地址不能包含控制字符或首尾空白。",
        ));
    }
    let url = url::Url::parse(&value.base_url)
        .map_err(|_| AppError::invalid("base_url", "模型地址格式无效。"))?;
    let has_userinfo = value.base_url.split_once("://").is_some_and(|(_, rest)| {
        rest.split(['/', '?', '#'])
            .next()
            .is_some_and(|authority| authority.contains('@'))
    });
    if !matches!(url.scheme(), "https" | "http")
        || url.host_str().is_none()
        || has_userinfo
        || !url.username().is_empty()
        || url.password().is_some()
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
    Ok(())
}

pub(crate) fn require_configured_profile(value: &ModelProfileInput) -> AppResult<()> {
    validate_profile(value)?;
    if value.model_name.trim().is_empty() || value.base_url.trim().is_empty() {
        return Err(AppError::invalid("model", "请先填写模型名称和模型地址。"));
    }
    Ok(())
}

fn validate_dimensions(value: &PersonaDimensions) -> AppResult<()> {
    if [
        value.professional,
        value.formal,
        value.casual,
        value.humor,
        value.direct,
        value.empathy,
        value.social_energy,
        value.activity,
    ]
    .into_iter()
    .any(|v| v > 100)
    {
        return Err(AppError::invalid(
            "dimensions",
            "人格维度必须在 0～100 之间。",
        ));
    }
    Ok(())
}

pub fn validate_avatar(conn: &Connection, avatar: &Option<String>) -> AppResult<()> {
    if let Some(id) = avatar {
        validate_id(id, "avatar_id")?;
        let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM avatar_objects WHERE id = ?1)",
            [id],
            |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::invalid(
                "avatar_id",
                "头像对象不存在，请重新选择。",
            ));
        }
    }
    Ok(())
}

pub fn update_avatar_refs(
    transaction: &Transaction<'_>,
    kind: &str,
    owner: &str,
    avatar: &Option<String>,
) -> AppResult<()> {
    transaction.execute(
        "DELETE FROM avatar_refs WHERE ref_kind = ?1 AND owner_id = ?2",
        params![kind, owner],
    )?;
    if let Some(id) = avatar {
        transaction.execute(
            "INSERT OR IGNORE INTO avatar_refs VALUES (?1, ?2, ?3)",
            params![id, kind, owner],
        )?;
    }
    Ok(())
}

fn read_global(conn: &Connection) -> AppResult<GlobalConfiguration> {
    let revision: i64 = conn.query_row(
        "SELECT revision FROM global_configuration WHERE singleton = 1",
        [],
        |row| row.get(0),
    )?;
    let mut statement = conn.prepare("SELECT p.profile_json, p.revision, b.reference IS NOT NULL FROM model_profiles p LEFT JOIN credential_bindings b ON b.reference=p.credential_ref AND b.profile_id=p.id AND b.endpoint=json_extract(p.profile_json,'$.base_url') AND b.protocol=json_extract(p.profile_json,'$.protocol') ORDER BY p.id")?;
    let rows = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, bool>(2)?,
            ))
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    let model_profiles = rows
        .into_iter()
        .map(|(json, revision, configured)| {
            let input: ModelProfileInput = serde_json::from_str(&json)?;
            Ok(ModelProfile {
                id: input.id,
                name: input.name,
                protocol: input.protocol,
                base_url: input.base_url,
                model_name: input.model_name,
                revision: revision.into(),
                credential_configured: configured,
            })
        })
        .collect::<AppResult<Vec<_>>>()?;
    let mut statement = conn.prepare("SELECT preset_json FROM persona_presets ORDER BY id")?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(0))?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    let persona_presets = rows
        .into_iter()
        .map(|json| serde_json::from_str(&json).map_err(Into::into))
        .collect::<AppResult<Vec<_>>>()?;
    Ok(GlobalConfiguration {
        revision: revision.into(),
        model_profiles,
        persona_presets,
    })
}

fn read_agents(conn: &Connection) -> AppResult<Vec<AgentConfiguration>> {
    let mut statement = conn.prepare("SELECT v.configuration_json FROM agent_configurations a JOIN agent_config_versions v ON v.agent_id = a.agent_id AND v.revision = a.active_revision ORDER BY a.agent_id")?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(0))?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    rows.into_iter()
        .map(|json| serde_json::from_str(&json).map_err(Into::into))
        .collect()
}

const NEWS_PREFERENCES_KEY: &str = "news";

fn read_news(conn: &Connection) -> AppResult<NewsConfigurationState> {
    let json: String = conn.query_row(
        "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
        [],
        |row| row.get(0),
    )?;
    let value: serde_json::Value = serde_json::from_str(&json)?;
    match value.get(NEWS_PREFERENCES_KEY) {
        Some(state) => {
            // 旧配置里的用户关键词已取消；只兼容读取，不带回新合同。
            let mut state = state.clone();
            if let Some(configuration) = state.get_mut("configuration").and_then(|value| value.as_object_mut()) {
                configuration.remove("query");
            }
            serde_json::from_value(state).map_err(Into::into)
        },
        None => Ok(NewsConfigurationState {
            revision: 0_i64.into(),
            configuration: NewsConfiguration::default(),
        }),
    }
}

impl Database {
    pub fn get_news_configuration(&self, generation: &str) -> AppResult<NewsConfigurationState> {
        self.check_generation(generation)?;
        read_news(&self.conn)
    }

    pub fn save_news_configuration(
        &mut self,
        request: NewsConfigurationSaveRequest,
    ) -> AppResult<NewsConfigurationState> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        crate::news::validate_configuration(&request.configuration)?;
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let current = read_news(&transaction)?;
        if current.revision != request.expected_revision {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "新闻配置已被其他操作更新，请重试。",
            ));
        }
        let revision = current
            .revision
            .0
            .parse::<i64>()
            .unwrap_or(0)
            .saturating_add(1);
        let next = NewsConfigurationState {
            revision: revision.into(),
            configuration: request.configuration,
        };
        let json: String = transaction.query_row(
            "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
            [],
            |row| row.get(0),
        )?;
        let mut preferences: serde_json::Value = serde_json::from_str(&json)?;
        preferences[NEWS_PREFERENCES_KEY] = serde_json::to_value(&next)?;
        transaction.execute(
            "UPDATE global_configuration SET preferences_json = ?1 WHERE singleton = 1",
            [serde_json::to_string(&preferences)?],
        )?;
        transaction.commit()?;
        Ok(next)
    }

    pub fn get_global_configuration(&self, generation: &str) -> AppResult<GlobalConfiguration> {
        self.check_generation(generation)?;
        read_global(&self.conn)
    }

    pub fn list_agents(&self, generation: &str) -> AppResult<Vec<AgentConfiguration>> {
        self.check_generation(generation)?;
        read_agents(&self.conn)
    }

    pub fn get_model_profile_internal(
        &self,
        id: &str,
    ) -> AppResult<(ModelProfile, Option<String>)> {
        validate_id(id, "profile_id")?;
        let (json, revision, reference): (String, i64, Option<String>) = self.conn.query_row("SELECT p.profile_json,p.revision,b.reference FROM model_profiles p LEFT JOIN credential_bindings b ON b.reference=p.credential_ref AND b.profile_id=p.id AND b.endpoint=json_extract(p.profile_json,'$.base_url') AND b.protocol=json_extract(p.profile_json,'$.protocol') WHERE p.id=?1", [id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))?;
        let input: ModelProfileInput = serde_json::from_str(&json)?;
        Ok((
            ModelProfile {
                id: input.id,
                name: input.name,
                protocol: input.protocol,
                base_url: input.base_url,
                model_name: input.model_name,
                revision: revision.into(),
                credential_configured: reference.is_some(),
            },
            reference,
        ))
    }

    pub fn replace_credential_reference(
        &mut self,
        id: &str,
        expected: &DecimalString,
        reference: Option<String>,
    ) -> AppResult<DomainEvent> {
        let revision = parse_counter(expected, "expected_revision")?;
        validate_id(id, "profile_id")?;
        if reference
            .as_ref()
            .is_some_and(|reference| Uuid::parse_str(reference).is_err())
        {
            return Err(AppError::invalid("credential_ref", "凭据引用无效。"));
        }
        let generation = self.generation_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let profile: String = transaction
            .query_row(
                "SELECT profile_json FROM model_profiles WHERE id=?1 AND revision=?2",
                params![id, revision],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| {
                AppError::new(
                    ErrorCode::ConfigConflict,
                    "模型配置已改变，请重新读取后设置凭据。",
                )
            })?;
        let profile: ModelProfileInput = serde_json::from_str(&profile)?;
        if let Some(reference) = &reference {
            require_configured_profile(&profile)?;
            transaction.execute(
                "INSERT INTO credential_bindings VALUES (?1,?2,?3,?4)",
                params![
                    reference,
                    id,
                    profile.base_url,
                    serde_json::to_value(&profile.protocol)?.as_str()
                ],
            )?;
        }
        transaction.execute(
            "UPDATE model_profiles SET credential_ref=?1,credential_endpoint=?2 WHERE id=?3",
            params![reference, profile.base_url, id],
        )?;
        let global_revision: i64 = transaction.query_row(
            "SELECT revision FROM global_configuration WHERE singleton=1",
            [],
            |row| row.get(0),
        )?;
        let global_revision = global_revision
            .checked_add(1)
            .ok_or_else(|| AppError::invalid("revision", "配置版本已达到数据库上限。"))?;
        transaction.execute(
            "UPDATE global_configuration SET revision=?1 WHERE singleton=1",
            [global_revision],
        )?;
        let event = record_event(
            &transaction,
            EventPayload::GlobalConfigurationChanged {
                revision: global_revision.into(),
            },
            &generation,
        )?;
        transaction.commit()?;
        Ok(event)
    }

    pub fn save_global_configuration(
        &mut self,
        request: GlobalConfigurationSaveRequest,
    ) -> AppResult<(GlobalConfiguration, Option<DomainEvent>)> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        if request.model_profiles.len() > 32 || request.persona_presets.len() > 32 {
            return Err(AppError::invalid("presets", "模型或人格预设最多 32 项。"));
        }
        let mut ids = HashSet::new();
        for profile in &request.model_profiles {
            validate_profile(profile)?;
            if !ids.insert(profile.id.clone()) {
                return Err(AppError::invalid("profile_id", "模型标识重复。"));
            }
        }
        let mut persona_ids = HashSet::new();
        for persona in &request.persona_presets {
            validate_id(&persona.id, "persona_id")?;
            bounded(&persona.name, "name", 80, true)?;
            bounded(&persona.language_style, "language_style", 2000, false)?;
            if persona.skill.len() > 65536 {
                return Err(AppError::invalid("skill", "SKILL 不能超过 64KiB。"));
            }
            validate_dimensions(&persona.dimensions)?;
            if !persona_ids.insert(persona.id.clone()) {
                return Err(AppError::invalid("persona_id", "人格预设标识重复。"));
            }
        }
        let hash = fingerprint(&serde_json::to_vec(&(
            &request.expected_revision,
            &request.model_profiles,
            &request.persona_presets,
        ))?);
        let generation = self.generation_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        if let Some(json) = replay_request(
            &transaction,
            &request.client_request_id,
            "global_configuration_save",
            &hash,
        )? {
            return Ok((serde_json::from_str(&json)?, None));
        }
        for agent in read_agents(&transaction)? {
            if agent
                .model
                .is_some_and(|model| !ids.contains(&model.source_profile_id))
            {
                return Err(AppError::new(
                    ErrorCode::ConfigConflict,
                    "仍有智能体使用此模型，不能删除引用中的预设。",
                ));
            }
        }
        let revision = parse_counter(&request.expected_revision, "expected_revision")?;
        let next_revision = revision
            .checked_add(1)
            .ok_or_else(|| AppError::invalid("expected_revision", "配置版本已达到数据库上限。"))?;
        let changed = transaction.execute("UPDATE global_configuration SET revision = ?1 WHERE singleton = 1 AND revision = ?2", params![next_revision, revision])?;
        if changed != 1 {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "全局配置已改变，编辑内容已保留，请重新读取。",
            ));
        }
        for profile in &request.model_profiles {
            let previous: Option<(String, i64)> = transaction
                .query_row(
                    "SELECT profile_json, revision FROM model_profiles WHERE id = ?1",
                    [&profile.id],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .optional()?;
            let json = serde_json::to_string(profile)?;
            let new_revision = match &previous {
                Some((old, revision)) if old == &json => *revision,
                Some((_, revision)) => revision.checked_add(1).ok_or_else(|| {
                    AppError::invalid("revision", "模型配置版本已达到数据库上限。")
                })?,
                None => {
                    let existed: bool = transaction.query_row(
                        "SELECT EXISTS(SELECT 1 FROM model_profile_versions WHERE profile_id=?1)",
                        [&profile.id],
                        |row| row.get(0),
                    )?;
                    if existed {
                        return Err(AppError::invalid(
                            "profile_id",
                            "此模型标识已用于历史配置，请为新预设使用新标识。",
                        ));
                    }
                    1
                }
            };
            transaction.execute("INSERT INTO model_profiles(id, revision, profile_json) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision, profile_json=excluded.profile_json", params![profile.id, new_revision, json])?;
            transaction.execute(
                "INSERT OR IGNORE INTO model_profile_versions VALUES (?1,?2,?3)",
                params![profile.id, new_revision, json],
            )?;
            if let Some((old, _)) = previous {
                let old: ModelProfileInput = serde_json::from_str(&old)?;
                if old.base_url != profile.base_url
                    || old.protocol != profile.protocol
                    || profile.model_name.trim().is_empty()
                {
                    transaction.execute("UPDATE model_profiles SET credential_ref=NULL, credential_endpoint=NULL WHERE id=?1", [&profile.id])?;
                }
            }
        }
        let existing = transaction
            .prepare("SELECT id FROM model_profiles")?
            .query_map([], |row| row.get::<_, String>(0))?
            .collect::<rusqlite::Result<Vec<_>>>()?;
        for id in existing {
            if !ids.contains(&id) {
                transaction.execute("DELETE FROM model_profiles WHERE id=?1", [id])?;
            }
        }
        transaction.execute("DELETE FROM persona_presets", [])?;
        for mut persona in request.persona_presets {
            persona.revision = next_revision.into();
            transaction.execute(
                "INSERT INTO persona_presets VALUES (?1, ?2, ?3)",
                params![persona.id, next_revision, serde_json::to_string(&persona)?],
            )?;
        }
        let result = read_global(&transaction)?;
        let event = record_event(
            &transaction,
            EventPayload::GlobalConfigurationChanged {
                revision: result.revision.clone(),
            },
            &generation,
        )?;
        record_request(
            &transaction,
            &request.client_request_id,
            "global_configuration_save",
            &hash,
            &result,
        )?;
        transaction.commit()?;
        Ok((result, Some(event)))
    }

    pub fn save_agent(
        &mut self,
        request: AgentSaveRequest,
    ) -> AppResult<(AgentConfiguration, Option<DomainEvent>)> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        let mut config = request.configuration;
        validate_id(&config.agent_id, "agent_id")?;
        bounded_display_name(&config.display_name, "display_name")?;
        bounded(&config.language_style, "language_style", 2000, false)?;
        if let Some(gender) = &config.gender_description {
            bounded(gender, "gender_description", 80, false)?;
        }
        if config.skill.len() > 65536 || config.skill.contains('\0') {
            return Err(AppError::invalid(
                "skill",
                "SKILL 超过长度上限或含无效字符。",
            ));
        }
        validate_dimensions(&config.dimensions)?;
        if let Some(model) = &config.model {
            require_configured_profile(&model.profile)?;
        }
        let hash = fingerprint(&serde_json::to_vec(&(&request.expected_revision, &config))?);
        let generation = self.generation_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        if let Some(json) = replay_request(
            &transaction,
            &request.client_request_id,
            "agent_save",
            &hash,
        )? {
            return Ok((serde_json::from_str(&json)?, None));
        }
        validate_avatar(&transaction, &config.avatar_id)?;
        if let Some(model) = &config.model {
            let exists: bool = transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM model_profiles WHERE id=?1)",
                [&model.source_profile_id],
                |row| row.get(0),
            )?;
            if !exists {
                return Err(AppError::invalid(
                    "model",
                    "来源模型预设已删除，请重新选择。",
                ));
            }
            let source: String = transaction.query_row("SELECT profile_json FROM model_profile_versions WHERE profile_id=?1 AND revision=?2", params![model.source_profile_id, parse_counter(&model.source_profile_revision,"source_profile_revision")?], |row| row.get(0)).optional()?.ok_or_else(|| AppError::invalid("model", "来源模型版本不存在，请重新选择预设。"))?;
            let source: ModelProfileInput = serde_json::from_str(&source)?;
            require_configured_profile(&source)?;
            if model.profile.id != model.source_profile_id
                || source.base_url != model.profile.base_url
                || source.protocol != model.profile.protocol
            {
                return Err(AppError::invalid(
                    "model",
                    "成员快照不能改变来源模型的凭据端点或协议，请先建立独立预设。",
                ));
            }
        }
        let previous: Option<i64> = transaction
            .query_row(
                "SELECT active_revision FROM agent_configurations WHERE agent_id=?1",
                [&config.agent_id],
                |row| row.get(0),
            )
            .optional()?;
        let expected = request
            .expected_revision
            .as_ref()
            .map(|revision| parse_counter(revision, "expected_revision"))
            .transpose()?;
        if previous != expected {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "智能体配置已改变，编辑内容已保留，请重新读取。",
            ));
        }
        let revision = previous
            .unwrap_or(0)
            .checked_add(1)
            .ok_or_else(|| AppError::invalid("revision", "成员配置版本已达到数据库上限。"))?;
        if previous.is_none() {
            let count: i64 =
                transaction.query_row("SELECT COUNT(*) FROM agent_configurations", [], |row| {
                    row.get(0)
                })?;
            if count >= 128 {
                return Err(AppError::invalid("agent_id", "本地成员最多 128 位。"));
            }
        }
        config.revision = revision.into();
        if previous.is_none() {
            transaction.execute("INSERT INTO participants(id, kind, display_name, status, created_at, avatar_id, profile_revision) VALUES (?1,'agent',?2,'needs_configuration',?3,?4,1)", params![config.agent_id, config.display_name, now_ms(), config.avatar_id])?;
        } else {
            transaction.execute("UPDATE participants SET display_name=?1,avatar_id=?2,profile_revision=profile_revision+1 WHERE id=?3 AND kind='agent'", params![config.display_name, config.avatar_id, config.agent_id])?;
        }
        transaction.execute(
            "INSERT INTO agent_config_versions VALUES (?1,?2,?3)",
            params![config.agent_id, revision, serde_json::to_string(&config)?],
        )?;
        transaction.execute("INSERT INTO agent_configurations VALUES (?1,?2) ON CONFLICT(agent_id) DO UPDATE SET active_revision=excluded.active_revision", params![config.agent_id, revision])?;
        update_avatar_refs(
            &transaction,
            "participant",
            &config.agent_id,
            &config.avatar_id,
        )?;
        update_avatar_refs(
            &transaction,
            "agent_revision",
            &format!("{}:{revision}", config.agent_id),
            &config.avatar_id,
        )?;
        super::runtime::reset_configuration_state(&transaction, &config)?;
        let event = record_event(
            &transaction,
            EventPayload::AgentConfigurationChanged {
                agent_id: config.agent_id.clone(),
                revision: config.revision.clone(),
            },
            &generation,
        )?;
        record_request(
            &transaction,
            &request.client_request_id,
            "agent_save",
            &hash,
            &config,
        )?;
        transaction.commit()?;
        Ok((config, Some(event)))
    }

    /// 删除智能体：清理配置、运行时状态与头像引用，并移除参与者。
    /// 历史消息仍保留原 sender_id，显示时按未知成员处理。
    pub fn delete_agent(&mut self, request: crate::domain::contracts::AgentDeleteRequest) -> AppResult<()> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.agent_id, "agent_id")?;
        let generation = self.generation_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let exists: bool = transaction.query_row(
            "SELECT EXISTS(SELECT 1 FROM agent_configurations WHERE agent_id=?1)",
            [&request.agent_id],
            |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::invalid("agent_id", "智能体不存在或已删除。"));
        }
        for table in [
            "agent_runtime_states",
            "agent_config_versions",
            "agent_configurations",
        ] {
            transaction.execute(&format!("DELETE FROM {table} WHERE agent_id=?1"), [&request.agent_id])?;
        }
        update_avatar_refs(&transaction, "participant", &request.agent_id, &None)?;
        transaction.execute("DELETE FROM participants WHERE id=?1 AND kind='agent'", [&request.agent_id])?;
        record_event(
            &transaction,
            EventPayload::AgentConfigurationChanged {
                agent_id: request.agent_id.clone(),
                revision: crate::domain::contracts::DecimalString("0".to_owned()),
            },
            &generation,
        )?;
        transaction.commit()?;
        Ok(())
    }

    pub fn get_user_profile(&self, generation: &str) -> AppResult<UserProfile> {
        self.check_generation(generation)?;
        let bio = read_user_bio(&self.conn)?;
        Ok(self.conn.query_row("SELECT id,display_name,avatar_id,profile_revision FROM participants WHERE id=?1 AND kind='user'", [&self.local_user_id], |row| Ok(UserProfile { participant_id: row.get(0)?, display_name: row.get(1)?, avatar_id: row.get(2)?, bio: bio.clone(), revision: row.get::<_,i64>(3)?.into() }))?)
    }

    pub fn save_user_profile(
        &mut self,
        request: UserProfileSaveRequest,
    ) -> AppResult<(UserProfile, Option<DomainEvent>)> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        bounded_display_name(&request.display_name, "display_name")?;
        bounded(&request.bio, "bio", 200, false)?;
        let hash = fingerprint(&serde_json::to_vec(&(
            &request.expected_revision,
            &request.display_name,
            &request.avatar_id,
            &request.bio,
        ))?);
        let generation = self.generation_id.clone();
        let user_id = self.local_user_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        if let Some(json) = replay_request(
            &transaction,
            &request.client_request_id,
            "user_profile_save",
            &hash,
        )? {
            return Ok((serde_json::from_str(&json)?, None));
        }
        validate_avatar(&transaction, &request.avatar_id)?;
        write_user_bio(&transaction, &request.bio)?;
        let expected = parse_counter(&request.expected_revision, "expected_revision")?;
        let next_revision = expected
            .checked_add(1)
            .ok_or_else(|| AppError::invalid("expected_revision", "资料版本已达到数据库上限。"))?;
        let changed = transaction.execute("UPDATE participants SET display_name=?1,avatar_id=?2,profile_revision=?3 WHERE id=?4 AND profile_revision=?5 AND kind='user'", params![request.display_name, request.avatar_id, next_revision, user_id, expected])?;
        if changed != 1 {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "个人资料已改变，编辑内容已保留，请重新读取。",
            ));
        }
        update_avatar_refs(&transaction, "participant", &user_id, &request.avatar_id)?;
        let result = transaction.query_row(
            "SELECT profile_revision FROM participants WHERE id=?1",
            [&user_id],
            |row| row.get::<_, i64>(0),
        )?;
        let profile = UserProfile {
            participant_id: user_id.clone(),
            display_name: request.display_name,
            avatar_id: request.avatar_id,
            bio: request.bio,
            revision: result.into(),
        };
        let participant = Participant {
            id: user_id,
            kind: ParticipantKind::User,
            display_name: profile.display_name.clone(),
            status: ParticipantStatus::Present,
            is_builtin: false,
            avatar_id: profile.avatar_id.clone(),
            profile_revision: profile.revision.clone(),
            runtime: None,
        };
        let event = record_event(
            &transaction,
            EventPayload::ParticipantProfileChanged { participant },
            &generation,
        )?;
        record_request(
            &transaction,
            &request.client_request_id,
            "user_profile_save",
            &hash,
            &profile,
        )?;
        transaction.commit()?;
        Ok((profile, Some(event)))
    }
}

const INBOX_PREFERENCES_KEY: &str = "inbox";

/// 单会话的已读进度与免打扰开关。存在 preferences_json 里，避免为附加状态修改表结构。
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct InboxPreference {
    #[serde(default)]
    last_read_seq: i64,
    #[serde(default)]
    muted: bool,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct InboxPreferences {
    #[serde(default)]
    revision: i64,
    #[serde(default)]
    conversations: BTreeMap<String, InboxPreference>,
}

fn read_inbox_preferences(conn: &Connection) -> AppResult<InboxPreferences> {
    let json: String = conn.query_row(
        "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
        [],
        |row| row.get(0),
    )?;
    let value: serde_json::Value = serde_json::from_str(&json)?;
    match value.get(INBOX_PREFERENCES_KEY) {
        Some(state) => serde_json::from_value(state.clone()).map_err(Into::into),
        None => Ok(InboxPreferences::default()),
    }
}

fn write_inbox_preferences(conn: &Connection, preferences: &InboxPreferences) -> AppResult<()> {
    let json: String = conn.query_row(
        "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
        [],
        |row| row.get(0),
    )?;
    let mut value: serde_json::Value = serde_json::from_str(&json)?;
    value[INBOX_PREFERENCES_KEY] = serde_json::to_value(preferences)?;
    conn.execute(
        "UPDATE global_configuration SET preferences_json = ?1 WHERE singleton = 1",
        [serde_json::to_string(&value)?],
    )?;
    Ok(())
}

/// 个人简介与 inbox/ui 一样放在 preferences_json，避免仅为展示字段升级数据库结构。
const USER_BIO_PREFERENCES_KEY: &str = "user_bio";

fn read_user_bio(conn: &Connection) -> AppResult<String> {
    let json: String = conn.query_row(
        "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
        [],
        |row| row.get(0),
    )?;
    let value: serde_json::Value = serde_json::from_str(&json)?;
    Ok(match value.get(USER_BIO_PREFERENCES_KEY) {
        Some(serde_json::Value::String(bio)) => bio.clone(),
        _ => String::new(),
    })
}

fn write_user_bio(conn: &Connection, bio: &str) -> AppResult<()> {
    let json: String = conn.query_row(
        "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
        [],
        |row| row.get(0),
    )?;
    let mut value: serde_json::Value = serde_json::from_str(&json)?;
    value[USER_BIO_PREFERENCES_KEY] = serde_json::to_value(bio)?;
    conn.execute(
        "UPDATE global_configuration SET preferences_json = ?1 WHERE singleton = 1",
        [serde_json::to_string(&value)?],
    )?;
    Ok(())
}

const UI_PREFERENCES_KEY: &str = "ui";

impl Database {
    pub fn get_ui_preferences(&self, generation: &str) -> AppResult<UiPreferences> {
        self.check_generation(generation)?;
        let json: String = self.conn.query_row(
            "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
            [],
            |row| row.get(0),
        )?;
        let value: serde_json::Value = serde_json::from_str(&json)?;
        match value.get(UI_PREFERENCES_KEY) {
            Some(state) => serde_json::from_value(state.clone()).map_err(Into::into),
            None => Ok(UiPreferences::default()),
        }
    }

    pub fn save_ui_preferences(&mut self, generation: &str, preferences: &UiPreferences) -> AppResult<()> {
        self.check_generation(generation)?;
        let json: String = self.conn.query_row(
            "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
            [],
            |row| row.get(0),
        )?;
        let mut value: serde_json::Value = serde_json::from_str(&json)?;
        value[UI_PREFERENCES_KEY] = serde_json::to_value(preferences)?;
        self.conn.execute(
            "UPDATE global_configuration SET preferences_json = ?1 WHERE singleton = 1",
            [serde_json::to_string(&value)?],
        )?;
        Ok(())
    }
}

/// 主窗口几何。逻辑像素，避免跨 DPI 显示器时按物理像素恢复导致漂移。
#[derive(Clone, Copy, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct WindowState {
    #[serde(default)]
    pub x: f64,
    #[serde(default)]
    pub y: f64,
    #[serde(default)]
    pub width: f64,
    #[serde(default)]
    pub height: f64,
    #[serde(default)]
    pub maximized: bool,
}

const WINDOW_PREFERENCES_KEY: &str = "window";

impl Database {
    pub fn get_window_state(&self, generation: &str) -> AppResult<Option<WindowState>> {
        self.check_generation(generation)?;
        let json: String = self.conn.query_row(
            "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
            [],
            |row| row.get(0),
        )?;
        let value: serde_json::Value = serde_json::from_str(&json)?;
        match value.get(WINDOW_PREFERENCES_KEY) {
            Some(state) => serde_json::from_value(state.clone()).map(Some).map_err(Into::into),
            None => Ok(None),
        }
    }

    pub fn save_window_state(&mut self, generation: &str, state: &WindowState) -> AppResult<()> {
        self.check_generation(generation)?;
        let json: String = self.conn.query_row(
            "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
            [],
            |row| row.get(0),
        )?;
        let mut value: serde_json::Value = serde_json::from_str(&json)?;
        value[WINDOW_PREFERENCES_KEY] = serde_json::to_value(state)?;
        self.conn.execute(
            "UPDATE global_configuration SET preferences_json = ?1 WHERE singleton = 1",
            [serde_json::to_string(&value)?],
        )?;
        Ok(())
    }
}

const IMAGE_EXTENSIONS: [&str; 7] = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"];

/// 把消息片段转成一行文本摘要：附件与表情不暴露内部 ID。
fn message_preview(parts: &[MessagePart]) -> String {
    let mut text = String::new();
    for part in parts {
        let piece = match part {
            MessagePart::Text { text } => text.replace(['\n', '\r'], " "),
            MessagePart::Attachment { attachment_id } => {
                let extension = attachment_id.rsplit('.').next().unwrap_or_default().to_ascii_lowercase();
                if IMAGE_EXTENSIONS.contains(&extension.as_str()) { "[图片]" } else { "[文件]" }.to_string()
            }
            MessagePart::Emote { .. } => "[表情包]".to_string(),
        };
        if !text.is_empty() && !piece.is_empty() {
            text.push(' ');
        }
        text.push_str(&piece);
    }
    let compact = text.split_whitespace().collect::<Vec<_>>().join(" ");
    if compact.is_empty() {
        "[消息]".to_string()
    } else {
        compact.chars().take(80).collect()
    }
}

impl Database {
    /// 读取所有会话的未读与最近消息。首次读取时把全部历史视为已读，避免新装即 999+。
    pub fn get_inbox(&mut self, generation: &str) -> AppResult<InboxSummary> {
        self.check_generation(generation)?;
        let mut preferences = read_inbox_preferences(&self.conn)?;
        let mut changed = false;
        let mut rooms = self
            .conn
            .prepare("SELECT id, name FROM room ORDER BY id")?
            .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))?
            .collect::<rusqlite::Result<Vec<_>>>()?;
        let mut conversations = Vec::new();
        let mut unread_total = 0_u32;
        for (id, name) in rooms.drain(..) {
            let latest_seq: i64 = self.conn.query_row(
                "SELECT COALESCE(MAX(seq), 0) FROM messages WHERE room_id = ?1 AND state = 'visible'",
                [&id],
                |row| row.get(0),
            )?;
            let entry = match preferences.conversations.get(&id) {
                Some(entry) => entry.clone(),
                None => {
                    changed = true;
                    let entry = InboxPreference { last_read_seq: latest_seq, muted: false };
                    preferences.conversations.insert(id.clone(), entry.clone());
                    entry
                }
            };
            let unread_count: i64 = self.conn.query_row(
                "SELECT COUNT(*) FROM messages WHERE room_id = ?1 AND seq > ?2 AND state = 'visible' AND sender_id <> ?3",
                params![id, entry.last_read_seq, self.local_user_id],
                |row| row.get(0),
            )?;
            let first_unread = self
                .conn
                .query_row(
                    "SELECT seq, id FROM messages WHERE room_id = ?1 AND seq > ?2 AND state = 'visible' AND sender_id <> ?3 ORDER BY seq ASC LIMIT 1",
                    params![id, entry.last_read_seq, self.local_user_id],
                    |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?)),
                )
                .optional()?;
            let latest = self
                .conn
                .query_row(
                    "SELECT seq FROM messages WHERE room_id = ?1 AND state = 'visible' ORDER BY seq DESC LIMIT 1",
                    [&id],
                    |row| row.get::<_, i64>(0),
                )
                .optional()?;
            let (latest_at, latest_sender, latest_preview) = match latest {
                Some(seq) => {
                    let message = load_messages(&self.conn, &[seq])?.into_iter().next();
                    match message {
                        Some(message) => {
                            let sender: Option<String> = self
                                .conn
                                .query_row(
                                    "SELECT display_name FROM participants WHERE id = ?1",
                                    [&message.sender_id],
                                    |row| row.get(0),
                                )
                                .optional()?;
                            (message.created_at, sender, message_preview(&message.parts))
                        }
                        None => (0, None, "[消息]".to_string()),
                    }
                }
                None => (0, None, "暂无消息".to_string()),
            };
            let unread_count = unread_count.max(0) as u32;
            if !entry.muted {
                unread_total = unread_total.saturating_add(unread_count);
            }
            conversations.push(InboxConversation {
                id,
                name,
                kind: "group".to_string(),
                unread_count,
                muted: entry.muted,
                last_read_seq: entry.last_read_seq.into(),
                latest_seq: latest.unwrap_or(0).into(),
                latest_at,
                latest_sender,
                latest_preview,
                first_unread_seq: first_unread.as_ref().map(|(seq, _)| (*seq).into()),
                first_unread_id: first_unread.map(|(_, id)| id),
            });
        }
        conversations.sort_by(|left, right| {
            right.latest_at.cmp(&left.latest_at).then_with(|| left.id.cmp(&right.id))
        });
        if changed {
            preferences.revision = preferences.revision.saturating_add(1);
            write_inbox_preferences(&self.conn, &preferences)?;
        }
        Ok(InboxSummary {
            revision: preferences.revision.into(),
            conversations,
            unread_total,
        })
    }

    pub fn mark_inbox_read(
        &mut self,
        request: InboxMarkReadRequest,
    ) -> AppResult<InboxSummary> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        validate_id(&request.conversation_id, "conversation_id")?;
        let exists: bool = self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM room WHERE id = ?1)",
            [&request.conversation_id],
            |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::invalid("conversation_id", "聊天对象不存在。"));
        }
        let through = request
            .through_seq
            .0
            .parse::<i64>()
            .map_err(|_| AppError::invalid("through_seq", "已读位置无效。"))?;
        let mut preferences = read_inbox_preferences(&self.conn)?;
        let entry = preferences
            .conversations
            .entry(request.conversation_id.clone())
            .or_default();
        let next = entry.last_read_seq.max(through.max(0));
        if next != entry.last_read_seq {
            entry.last_read_seq = next;
            preferences.revision = preferences.revision.saturating_add(1);
            write_inbox_preferences(&self.conn, &preferences)?;
        }
        self.get_inbox(&request.data_generation_id)
    }

    pub fn set_inbox_muted(&mut self, request: InboxMuteRequest) -> AppResult<InboxSummary> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        validate_id(&request.conversation_id, "conversation_id")?;
        let exists: bool = self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM room WHERE id = ?1)",
            [&request.conversation_id],
            |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::invalid("conversation_id", "聊天对象不存在。"));
        }
        let mut preferences = read_inbox_preferences(&self.conn)?;
        let entry = preferences
            .conversations
            .entry(request.conversation_id.clone())
            .or_default();
        if entry.muted != request.muted {
            entry.muted = request.muted;
            preferences.revision = preferences.revision.saturating_add(1);
            write_inbox_preferences(&self.conn, &preferences)?;
        }
        self.get_inbox(&request.data_generation_id)
    }
}

#[cfg(test)]
mod display_name_tests {
    use super::{bounded_display_name, display_width};

    #[test]
    fn display_width_counts_cjk_as_two_and_ascii_as_one() {
        assert_eq!(display_width("中文"), 4);
        assert_eq!(display_width("abcdefghijklmnop"), 16);
        assert_eq!(display_width("八个中文😀"), 10);
    }

    #[test]
    fn bounded_display_name_enforces_eight_cjk_or_sixteen_ascii() {
        assert!(bounded_display_name("八个中文昵称啊哈", "display_name").is_ok());
        assert!(bounded_display_name("abcdefghijklmnop", "display_name").is_ok());
        assert!(bounded_display_name("八个中文昵称啊哈哈", "display_name").is_err());
        assert!(bounded_display_name("abcdefghijklmnopq", "display_name").is_err());
    }
}
