use std::collections::HashSet;

use rusqlite::{Connection, OptionalExtension, Transaction, params};
use uuid::Uuid;

use super::{
    chat::{record_event, record_request, replay_request},
    database::{Database, fingerprint},
};
use crate::domain::{
    contracts::*,
    error::{AppResult, now_ms, parse_counter, validate_id},
};

pub const BASE_SKILL: &str = "你是群里一位平等的智能体成员，不是默认服务某个人的客服。群主与成员聊天地位相同。没有新内容、不感兴趣或话题已经结束时允许沉默。按自己的性格自然表达，不每句总结、提供帮助或反问。不虚构新闻、经历或记忆，不为了拟人频繁错字或撤回。工具和联网始终受本地用户授权与预算约束。";

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

pub fn sage_dimensions() -> PersonaDimensions {
    PersonaDimensions {
        professional: 85,
        formal: 80,
        casual: 85,
        humor: 85,
        direct: 85,
        empathy: 90,
        social_energy: 90,
        activity: 90,
    }
}

pub fn default_preferences() -> AgentPreferences {
    AgentPreferences {
        request_limit_daily: 500,
        persistent_memory: false,
        allow_autonomous_wake: false,
    }
}

pub fn seed_configuration(conn: &Connection) -> AppResult<()> {
    conn.execute(
        "INSERT INTO global_configuration VALUES (1, 1, ?1)",
        [serde_json::to_string(&default_preferences())?],
    )?;
    let persona = PersonaPreset {
        id: "natural-member".into(),
        name: "自然成员".into(),
        language_style: "自然、简短、有具体语境".into(),
        address_terms: Vec::new(),
        skill: BASE_SKILL.into(),
        dimensions: default_dimensions(),
        revision: 1_i64.into(),
    };
    conn.execute(
        "INSERT INTO persona_presets VALUES (?1, 1, ?2)",
        params![persona.id, serde_json::to_string(&persona)?],
    )?;
    let mut statement = conn.prepare(
        "SELECT id, display_name, introduction, avatar_id FROM participants WHERE kind = 'agent'",
    )?;
    let agents = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
            ))
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    for (id, name, introduction, avatar_id) in agents {
        let config = AgentConfiguration {
            agent_id: id,
            revision: 1_i64.into(),
            dimensions: if name == "Sage" {
                sage_dimensions()
            } else {
                default_dimensions()
            },
            display_name: name,
            introduction,
            gender_description: None,
            address_terms: Vec::new(),
            language_style: persona.language_style.clone(),
            skill: BASE_SKILL.into(),
            avatar_id,
            agent_type: AgentType::Social,
            model: None,
            preferences: default_preferences(),
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

fn validate_parameters(value: &ModelParameters) -> AppResult<()> {
    if !value.temperature.is_finite()
        || !(0.0..=2.0).contains(&value.temperature)
        || !value.top_p.is_finite()
        || !(0.0..=1.0).contains(&value.top_p)
        || value.top_p == 0.0
        || !(1..=32768).contains(&value.max_output_tokens)
        || !(256..=128000).contains(&value.input_budget)
    {
        return Err(AppError::invalid("parameters", "模型参数超出支持范围。"));
    }
    Ok(())
}

fn validate_profile(value: &ModelProfileInput) -> AppResult<()> {
    validate_id(&value.id, "profile_id")?;
    bounded(&value.name, "name", 80, true)?;
    bounded(&value.model_name, "model_name", 200, false)?;
    bounded(&value.base_url, "base_url", 2048, false)?;
    validate_parameters(&value.parameters)?;
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

fn validate_preferences(value: &AgentPreferences) -> AppResult<()> {
    if !(1..=5000).contains(&value.request_limit_daily) {
        return Err(AppError::invalid(
            "request_limit_daily",
            "每日请求上限必须在 1～5000 之间。",
        ));
    }
    Ok(())
}

fn validate_terms(terms: &[String]) -> AppResult<()> {
    if terms.len() > 16 {
        return Err(AppError::invalid("address_terms", "称呼最多 16 项。"));
    }
    for term in terms {
        bounded(term, "address_terms", 80, true)?;
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
    let (revision, preferences): (i64, String) = conn.query_row(
        "SELECT revision, preferences_json FROM global_configuration WHERE singleton = 1",
        [],
        |row| Ok((row.get(0)?, row.get(1)?)),
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
                parameters: input.parameters,
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
        runtime_defaults: serde_json::from_str(&preferences)?,
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

impl Database {
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
                parameters: input.parameters,
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
        validate_preferences(&request.runtime_defaults)?;
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
            validate_terms(&persona.address_terms)?;
            validate_dimensions(&persona.dimensions)?;
            if !persona_ids.insert(persona.id.clone()) {
                return Err(AppError::invalid("persona_id", "人格预设标识重复。"));
            }
        }
        let hash = fingerprint(&serde_json::to_vec(&(
            &request.expected_revision,
            &request.model_profiles,
            &request.persona_presets,
            &request.runtime_defaults,
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
        let changed = transaction.execute("UPDATE global_configuration SET revision = ?1, preferences_json = ?2 WHERE singleton = 1 AND revision = ?3", params![next_revision, serde_json::to_string(&request.runtime_defaults)?, revision])?;
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
        bounded(&config.display_name, "display_name", 80, true)?;
        bounded(&config.introduction, "introduction", 2000, false)?;
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
        validate_terms(&config.address_terms)?;
        validate_dimensions(&config.dimensions)?;
        validate_preferences(&config.preferences)?;
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
            transaction.execute("INSERT INTO participants(id, kind, display_name, introduction, status, created_at, avatar_id, profile_revision) VALUES (?1,'agent',?2,?3,'needs_configuration',?4,?5,1)", params![config.agent_id, config.display_name, config.introduction, now_ms(), config.avatar_id])?;
        } else {
            transaction.execute("UPDATE participants SET display_name=?1,introduction=?2,avatar_id=?3,profile_revision=profile_revision+1 WHERE id=?4 AND kind='agent'", params![config.display_name, config.introduction, config.avatar_id, config.agent_id])?;
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

    pub fn get_user_profile(&self, generation: &str) -> AppResult<UserProfile> {
        self.check_generation(generation)?;
        Ok(self.conn.query_row("SELECT id,display_name,introduction,avatar_id,profile_revision FROM participants WHERE id=?1 AND kind='user'", [&self.local_user_id], |row| Ok(UserProfile { participant_id: row.get(0)?, display_name: row.get(1)?, introduction: row.get(2)?, avatar_id: row.get(3)?, revision: row.get::<_,i64>(4)?.into() }))?)
    }

    pub fn save_user_profile(
        &mut self,
        request: UserProfileSaveRequest,
    ) -> AppResult<(UserProfile, Option<DomainEvent>)> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        bounded(&request.display_name, "display_name", 80, true)?;
        bounded(&request.introduction, "introduction", 2000, false)?;
        let hash = fingerprint(&serde_json::to_vec(&(
            &request.expected_revision,
            &request.display_name,
            &request.introduction,
            &request.avatar_id,
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
        let expected = parse_counter(&request.expected_revision, "expected_revision")?;
        let next_revision = expected
            .checked_add(1)
            .ok_or_else(|| AppError::invalid("expected_revision", "资料版本已达到数据库上限。"))?;
        let changed = transaction.execute("UPDATE participants SET display_name=?1,introduction=?2,avatar_id=?3,profile_revision=?4 WHERE id=?5 AND profile_revision=?6 AND kind='user'", params![request.display_name, request.introduction, request.avatar_id, next_revision, user_id, expected])?;
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
            introduction: request.introduction,
            avatar_id: request.avatar_id,
            revision: result.into(),
        };
        let participant = Participant {
            id: user_id,
            kind: ParticipantKind::User,
            display_name: profile.display_name.clone(),
            introduction: profile.introduction.clone(),
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
