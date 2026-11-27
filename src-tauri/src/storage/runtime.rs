use std::time::Instant;

use rusqlite::{Connection, OptionalExtension, Transaction, TransactionBehavior, params};
use tokio_util::sync::CancellationToken;

use super::{
    chat::{allocated_seq, insert_message, load_messages, record_event, validate_message_content},
    database::{Database, fingerprint},
};
use crate::domain::{
    RECALL_WINDOW,
    contracts::*,
    error::{AppResult, now_ms, parse_counter, validate_id},
};

const UTC_DAY_MS: i64 = 86_400_000;
const HOUR_MS: i64 = 3_600_000;
const MINUTE_MS: i64 = 60_000;
/// 同一话题链的限流窗口：只在最近 30 分钟内计数，避免长对话被永久锁死。
const CHAIN_WINDOW_MS: i64 = 30 * MINUTE_MS;
const MAX_TIMESTAMP: i64 = 9_007_199_254_740_991;

pub struct RuntimeInput {
    pub agent: AgentConfiguration,
    pub credential_ref: String,
    pub snapshot: AppSnapshot,
    pub messages: Vec<ChatMessage>,
    pub quoted_messages: Vec<ChatMessage>,
    pub experiences: Vec<ExperienceEntry>,
    pub experience_revision: String,
}

#[derive(Clone)]
pub struct RuntimeExperience {
    pub data_generation_id: String,
    pub agent_id: String,
    pub config_revision: DecimalString,
    pub observed_through_seq: DecimalString,
    pub observed_content_epoch: DecimalString,
    pub decision_id: Option<String>,
    pub experience_revision: String,
    pub content: String,
    pub score: u8,
    pub cancellation: CancellationToken,
}

#[derive(Clone)]
pub struct RuntimeMessage {
    pub agent_id: String,
    pub config_revision: DecimalString,
    pub observed_through_seq: DecimalString,
    pub observed_content_epoch: DecimalString,
    pub observed_experience_revision: String,
    pub decision_id: String,
    pub ordinal: u32,
    pub chain_id: String,
    pub parts: Vec<MessagePart>,
    pub quote_message_id: Option<String>,
    pub mention_ids: Vec<String>,
    pub mention_all: bool,
    pub cancellation: CancellationToken,
}

fn read_agent(conn: &Connection, id: &str) -> AppResult<AgentConfiguration> {
    validate_id(id, "agent_id")?;
    let json: String = conn.query_row(
        "SELECT v.configuration_json FROM agent_configurations a JOIN agent_config_versions v ON v.agent_id=a.agent_id AND v.revision=a.active_revision JOIN participants p ON p.id=a.agent_id AND p.kind='agent' WHERE a.agent_id=?1",
        [id], |row| row.get(0),
    )?;
    Ok(serde_json::from_str(&json)?)
}

// Credentials are taken from the current source profile, never from its
// historical version. A changed endpoint/protocol cannot reuse a stale secret.
fn credential_reference(
    conn: &Connection,
    agent: &AgentConfiguration,
) -> AppResult<Option<String>> {
    let Some(model) = &agent.model else {
        return Ok(None);
    };
    if model.profile.id != model.source_profile_id
        || super::configuration::require_configured_profile(&model.profile).is_err()
    {
        return Ok(None);
    }
    Ok(conn.query_row(
        "SELECT b.reference FROM model_profiles p JOIN credential_bindings b ON b.reference=p.credential_ref AND b.profile_id=p.id AND b.endpoint=json_extract(p.profile_json,'$.base_url') AND b.protocol=json_extract(p.profile_json,'$.protocol') WHERE p.id=?1 AND b.endpoint=?2 AND b.protocol=?3 AND p.credential_endpoint=b.endpoint AND trim(json_extract(p.profile_json,'$.model_name'))<>''",
        params![model.source_profile_id, model.profile.base_url, serde_json::to_value(&model.profile.protocol)?.as_str()],
        |row| row.get(0),
    ).optional()?)
}

pub(crate) fn participant_status(status: &AgentRuntimeStatus) -> ParticipantStatus {
    match status {
        AgentRuntimeStatus::Observing
        | AgentRuntimeStatus::Deciding
        | AgentRuntimeStatus::WaitingToSend
        | AgentRuntimeStatus::Sleeping => ParticipantStatus::Present,
        _ => ParticipantStatus::NeedsConfiguration,
    }
}

fn validate_timestamp(value: Option<i64>) -> AppResult<()> {
    if value.is_some_and(|value| !(0..=MAX_TIMESTAMP).contains(&value)) {
        return Err(AppError::invalid(
            "next_wake_at",
            "唤醒时间必须为有效的 UTC 毫秒时间。",
        ));
    }
    Ok(())
}

fn count_today(conn: &Connection, id: &str, now: i64) -> AppResult<u32> {
    Ok(conn.query_row(
        "SELECT COALESCE((SELECT requests FROM runtime_request_counts WHERE requester_id=?1 AND utc_day=?2),0)",
        params![id, now.div_euclid(UTC_DAY_MS)], |row| row.get(0),
    )?)
}

fn read_runtime_state(
    conn: &Connection,
    agent: &AgentConfiguration,
    now: i64,
) -> AppResult<AgentRuntimeState> {
    let revision = parse_counter(&agent.revision, "config_revision")?;
    let stored: Option<(i64, String, Option<String>, Option<i64>)> = conn.query_row(
        "SELECT config_revision,status,detail,next_wake_at FROM agent_runtime_states WHERE agent_id=?1",
        [&agent.agent_id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
    ).optional()?;
    let configured = credential_reference(conn, agent)?.is_some();
    let (status, detail, next_wake_at) = match stored {
        // Pause is explicitly durable across configuration changes.
        Some((_, status, detail, _)) if status == "paused" => {
            (AgentRuntimeStatus::Paused, detail, None)
        }
        Some((stored_revision, status, detail, next)) if stored_revision == revision => {
            let status: AgentRuntimeStatus =
                serde_json::from_value(serde_json::Value::String(status))?;
            if status == AgentRuntimeStatus::Protected {
                (status, detail, None)
            } else if !configured {
                (AgentRuntimeStatus::NeedsConfiguration, None, None)
            } else {
                (status, detail, next)
            }
        }
        _ if !configured => (AgentRuntimeStatus::NeedsConfiguration, None, None),
        _ => (AgentRuntimeStatus::Offline, None, None),
    };
    Ok(AgentRuntimeState {
        agent_id: agent.agent_id.clone(),
        config_revision: agent.revision.clone(),
        status,
        detail,
        next_wake_at,
        requests_today: count_today(conn, &agent.agent_id, now)?,
    })
}

pub(crate) fn read_runtime_states(conn: &Connection) -> AppResult<Vec<AgentRuntimeState>> {
    let ids = conn
        .prepare("SELECT agent_id FROM agent_configurations ORDER BY agent_id")?
        .query_map([], |row| row.get::<_, String>(0))?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    let now = now_ms();
    ids.into_iter()
        .map(|id| read_runtime_state(conn, &read_agent(conn, &id)?, now))
        .collect()
}

fn write_state(transaction: &Transaction<'_>, state: &AgentRuntimeState) -> AppResult<()> {
    transaction.execute(
        "INSERT INTO agent_runtime_states(agent_id,config_revision,status,detail,next_wake_at) VALUES (?1,?2,?3,?4,?5) ON CONFLICT(agent_id) DO UPDATE SET config_revision=excluded.config_revision,status=excluded.status,detail=excluded.detail,next_wake_at=excluded.next_wake_at",
        params![state.agent_id, parse_counter(&state.config_revision,"config_revision")?, serde_json::to_value(&state.status)?.as_str(), state.detail, state.next_wake_at],
    )?;
    Ok(())
}

fn state_event(
    transaction: &Transaction<'_>,
    state: &AgentRuntimeState,
    generation: &str,
) -> AppResult<DomainEvent> {
    // A state update needs one participant, not another read of every agent's
    // full configuration and credential binding in a potentially large room.
    let participant = transaction.query_row(
        "SELECT id,display_name,builtin_key IS NOT NULL,avatar_id,profile_revision FROM participants WHERE id=?1 AND kind='agent'",
        [&state.agent_id], |row| Ok(Participant {
            id: row.get(0)?, kind: ParticipantKind::Agent, display_name: row.get(1)?,
            status: participant_status(&state.status), is_builtin: row.get(2)?, avatar_id: row.get(3)?,
            profile_revision: row.get::<_,i64>(4)?.into(), runtime: Some(state.clone()),
        }),
    )?;
    record_event(
        transaction,
        EventPayload::ParticipantProfileChanged { participant },
        generation,
    )
}

fn same_state(left: &AgentRuntimeState, right: &AgentRuntimeState) -> bool {
    // requests_today is authoritative durable accounting, not caller state.
    left.agent_id == right.agent_id
        && left.config_revision == right.config_revision
        && left.status == right.status
        && left.detail == right.detail
        && left.next_wake_at == right.next_wake_at
}

pub(crate) fn reset_configuration_state(
    transaction: &Transaction<'_>,
    agent: &AgentConfiguration,
) -> AppResult<()> {
    let paused: bool = transaction.query_row(
        "SELECT EXISTS(SELECT 1 FROM agent_runtime_states WHERE agent_id=?1 AND status='paused')",
        [&agent.agent_id],
        |row| row.get(0),
    )?;
    transaction.execute(
        "DELETE FROM runtime_plans WHERE agent_id=?1",
        [&agent.agent_id],
    )?;
    write_state(
        transaction,
        &AgentRuntimeState {
            agent_id: agent.agent_id.clone(),
            config_revision: agent.revision.clone(),
            status: if paused {
                AgentRuntimeStatus::Paused
            } else if credential_reference(transaction, agent)?.is_some() {
                AgentRuntimeStatus::Offline
            } else {
                AgentRuntimeStatus::NeedsConfiguration
            },
            detail: None,
            next_wake_at: None,
            requests_today: count_today(transaction, &agent.agent_id, now_ms())?,
        },
    )
}

fn cancelled(token: &CancellationToken) -> AppResult<()> {
    if token.is_cancelled() {
        return Err(AppError::new(
            ErrorCode::ShuttingDown,
            "智能体动作已取消，未提交消息。",
        ));
    }
    Ok(())
}

fn tool_decision_prefix(id: &str) -> String {
    format!("tool-{}-", fingerprint(id.as_bytes()))
}

pub(crate) fn tool_decision_id(id: &str, seq: &DecimalString) -> String {
    format!("{}{seq}", tool_decision_prefix(id), seq = seq.0)
}

fn tool_origin(conn: &Connection, room: &str, id: &str, seq: i64) -> AppResult<Option<String>> {
    Ok(conn.query_row(
        "SELECT m.id FROM messages m JOIN mentions n ON n.message_id=m.id
         WHERE m.room_id=?1 AND m.seq=?2 AND m.sender_id<>?3 AND m.state='visible' AND m.mention_all=0 AND n.target_participant_id=?3",
        params![room, seq, id], |row| row.get(0),
    ).optional()?)
}

impl Database {
    pub(crate) fn ensure_tool_workspace(&self, generation: &str, id: &str) -> AppResult<std::path::PathBuf> {
        self.check_generation(generation)?;
        if read_agent(&self.conn, id)?.agent_type != AgentType::Tool {
            return Err(AppError::invalid("agent_id", "只有工具助手拥有独立工作区。"));
        }
        let path = crate::runtime::local_tools::workspace_directory(&self.root, id, true)?;
        Ok(path.expect("创建工作区成功时必须返回目录"))
    }

    pub fn runtime_input(&mut self, id: &str) -> AppResult<RuntimeInput> {
        self.runtime_input_for(id, None)
    }

    pub(crate) fn runtime_credential_reference(&self, id: &str) -> AppResult<Option<String>> {
        credential_reference(&self.conn, &read_agent(&self.conn, id)?)
    }

    pub(crate) fn runtime_input_for(&mut self, id: &str, task: Option<DecimalString>) -> AppResult<RuntimeInput> {
        let room = self.room_id.clone();
        let root = self.root.clone();
        let (snapshot, (agent, credential_ref, messages, quoted_messages, experiences, experience_revision)) = self.snapshot_with(
            AppSnapshotRequest { data_generation_id: None, last_event_seq: None },
            |conn| {
                let agent = read_agent(conn, id)?;
                let credential_ref = credential_reference(conn, &agent)?.ok_or_else(|| {
                    AppError::new(ErrorCode::InvalidInput, "智能体缺少有效模型或当前来源凭据，请重新配置。")
                })?;
                let mut sequences = if let Some(task) = &task {
                    let seq = parse_counter(task, "tool_request_seq")?;
                    if agent.agent_type != AgentType::Tool || tool_origin(conn, &room, id, seq)?.is_none() {
                        return Err(AppError::new(ErrorCode::ConfigConflict, "原委托已不可用。"));
                    }
                    vec![seq]
                } else {
                    conn.prepare(
                        "SELECT seq FROM messages WHERE room_id=?1 AND state='visible' ORDER BY seq DESC LIMIT 64",
                    )?.query_map([&room], |row| row.get(0))?.collect::<rusqlite::Result<Vec<i64>>>()?
                };
                sequences.reverse();
                let messages = load_messages(conn, &sequences)?;
                let quote_ids: Vec<_> = messages.iter().rev().filter_map(|message| message.quote_message_id.clone()).take(32).collect();
                let quoted_messages = super::chat::resolve_quotes(conn, &room, &quote_ids)?;
                let (entries, experience_revision) = super::experience::read_snapshot(&root, id)?;
                let experiences = super::experience::context_entries(entries);
                Ok((agent, credential_ref, messages, quoted_messages, experiences, experience_revision))
            },
        )?;
        Ok(RuntimeInput {
            agent,
            credential_ref,
            snapshot,
            messages,
            quoted_messages,
            experiences,
            experience_revision,
        })
    }

    fn ensure_experience_agent(&self, generation: &str, id: &str) -> AppResult<()> {
        self.check_generation(generation)?;
        super::experience::validate_agent_id(id)?;
        let exists: bool = self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM agent_configurations a JOIN participants p ON p.id=a.agent_id AND p.kind='agent' WHERE a.agent_id=?1)",
            [id], |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::invalid("agent_id", "智能体不存在。"));
        }
        Ok(())
    }

    pub fn list_experience(&self, request: ExperienceAgentRequest) -> AppResult<Vec<ExperienceEntry>> {
        self.ensure_experience_agent(&request.data_generation_id, &request.agent_id)?;
        super::experience::list(&self.root, &request.agent_id)
    }

    pub fn add_experience(&self, request: ExperienceAddRequest) -> AppResult<ExperienceEntry> {
        self.ensure_experience_agent(&request.data_generation_id, &request.agent_id)?;
        super::experience::add(&self.root, &request.agent_id, &request.content, request.score)
    }

    pub fn update_experience(&self, request: crate::domain::contracts::ExperienceUpdateRequest) -> AppResult<ExperienceEntry> {
        self.ensure_experience_agent(&request.data_generation_id, &request.agent_id)?;
        super::experience::update(&self.root, &request.agent_id, &request)
    }

    pub fn delete_experience(&self, request: ExperienceDeleteRequest) -> AppResult<Vec<ExperienceEntry>> {
        self.ensure_experience_agent(&request.data_generation_id, &request.agent_id)?;
        super::experience::delete(&self.root, &request.agent_id, &request.entry_id)
    }

    pub fn prune_experience(&self, request: ExperiencePruneRequest) -> AppResult<Vec<ExperienceEntry>> {
        self.ensure_experience_agent(&request.data_generation_id, &request.agent_id)?;
        super::experience::prune(&self.root, &request.agent_id, request.max_entries as usize)
    }

    pub fn record_experience(&mut self, experience: RuntimeExperience) -> AppResult<()> {
        self.ensure_experience_agent(&experience.data_generation_id, &experience.agent_id)?;
        cancelled(&experience.cancellation)?;
        let observed = parse_counter(&experience.observed_through_seq, "observed_through_seq")?;
        let epoch = parse_counter(&experience.observed_content_epoch, "observed_content_epoch")?;
        let revision = parse_counter(&experience.config_revision, "config_revision")?;
        if let Some(id) = &experience.decision_id {
            validate_id(id, "decision_id")?;
        }
        let root = self.root.clone();
        let transaction = self.conn.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let agent = read_agent(&transaction, &experience.agent_id)?;
        let state = read_runtime_state(&transaction, &agent, now_ms())?;
        let current_epoch: i64 = transaction.query_row("SELECT content_epoch FROM room WHERE singleton=1", [], |row| row.get(0))?;
        if parse_counter(&agent.revision, "config_revision")? != revision || current_epoch != epoch
            || matches!(state.status, AgentRuntimeStatus::Paused | AgentRuntimeStatus::Protected)
            || credential_reference(&transaction, &agent)?.is_none()
        {
            return Err(AppError::new(ErrorCode::ConfigConflict, "经历来源的配置或观察已改变，未写入旧决定。"));
        }
        let latest = allocated_seq(&transaction, "messages")?;
        let stale = if let Some(decision_id) = &experience.decision_id {
            let committed: bool = transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM runtime_messages WHERE decision_id=?1 AND agent_id=?2 AND config_revision=?3 AND observed_through_seq=?4 AND ordinal=0)",
                params![decision_id, experience.agent_id, revision, observed], |row| row.get(0),
            )?;
            let origin_changed = if agent.agent_type == AgentType::Tool {
                *decision_id != tool_decision_id(&agent.agent_id, &experience.observed_through_seq)
                    || tool_origin(&transaction, &self.room_id, &agent.agent_id, observed)?.is_none()
            } else {
                transaction.query_row(
                    "SELECT EXISTS(SELECT 1 FROM runtime_message_activity WHERE message_seq>?1 AND (decision_id IS NULL OR decision_id<>?2 OR sender_id<>?3))",
                    params![observed, decision_id, experience.agent_id], |row| row.get(0),
                )?
            };
            !committed || observed > latest || origin_changed
        } else {
            agent.agent_type == AgentType::Tool || observed != latest
        };
        let (_, current_revision) = super::experience::read_snapshot(&root, &experience.agent_id)?;
        if stale || current_revision != experience.experience_revision {
            return Err(AppError::new(ErrorCode::ConfigConflict, "经历或消息已改变，未写入旧决定。"));
        }
        super::experience::add_checked(&root, &experience.agent_id, &experience.content, experience.score, || {
            cancelled(&experience.cancellation)?;
            let (_, current_revision) = super::experience::read_snapshot(&root, &experience.agent_id)?;
            if current_revision != experience.experience_revision {
                return Err(AppError::new(ErrorCode::ConfigConflict, "经历已改变，未写入旧决定。"));
            }
            Ok(())
        })?;
        transaction.commit()?;
        Ok(())
    }

    pub fn runtime_states(&self) -> AppResult<Vec<AgentRuntimeState>> {
        read_runtime_states(&self.conn)
    }

    pub fn runtime_mention_seq(
        &self,
        id: &str,
        after_seq: DecimalString,
    ) -> AppResult<DecimalString> {
        validate_id(id, "agent_id")?;
        let after = parse_counter(&after_seq, "after_seq")?;
        let seq: i64 = self.conn.query_row(
            "SELECT COALESCE(MAX(m.seq),0) FROM messages m WHERE m.room_id=?1 AND m.seq>?2 AND m.sender_id<>?3 AND m.state='visible' AND (m.mention_all=1 OR EXISTS(SELECT 1 FROM mentions n WHERE n.message_id=m.id AND n.target_participant_id=?3) OR EXISTS(SELECT 1 FROM messages q WHERE q.id=m.quote_message_id AND q.sender_id=?3 AND q.state='visible'))",
            params![self.room_id, after, id], |row| row.get(0),
        )?;
        Ok(seq.into())
    }

    pub(crate) fn next_tool_request(&self, id: &str, after: i64, through: i64) -> AppResult<Option<DecimalString>> {
        Ok(self.conn.query_row(
            "SELECT m.seq FROM messages m JOIN mentions n ON n.message_id=m.id
             WHERE m.room_id=?1 AND m.seq>?2 AND m.seq<=?3 AND m.sender_id<>?4 AND m.state='visible' AND m.mention_all=0
               AND n.target_participant_id=?4
               AND NOT EXISTS(SELECT 1 FROM runtime_messages r WHERE r.decision_id=(?5 || m.seq) AND r.ordinal=0)
             ORDER BY m.seq LIMIT 1",
            params![self.room_id, after, through, id, tool_decision_prefix(id)], |row| row.get::<_, i64>(0),
        ).optional()?.map(Into::into))
    }

    pub fn runtime_is_paused(&self, id: &str) -> AppResult<bool> {
        validate_id(id, "agent_id")?;
        Ok(self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM agent_runtime_states WHERE agent_id=?1 AND status='paused')",
            [id], |row| row.get(0),
        )?)
    }

    pub fn set_runtime_state(
        &mut self,
        mut state: AgentRuntimeState,
    ) -> AppResult<Option<DomainEvent>> {
        validate_id(&state.agent_id, "agent_id")?;
        parse_counter(&state.config_revision, "config_revision")?;
        validate_timestamp(state.next_wake_at)?;
        if state
            .detail
            .as_ref()
            .is_some_and(|text| text.len() > 4096 || text.contains('\0'))
        {
            return Err(AppError::invalid(
                "detail",
                "运行状态说明过长或含无效字符。",
            ));
        }
        let generation = self.generation_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let agent = read_agent(&transaction, &state.agent_id)?;
        let current = read_runtime_state(&transaction, &agent, now_ms())?;
        if state.config_revision != agent.revision || current.status == AgentRuntimeStatus::Paused {
            return Ok(None);
        }
        // Only the explicit pause API is allowed to create or remove a pause.
        if state.status == AgentRuntimeStatus::Paused {
            return Err(AppError::invalid("status", "暂停请使用显式暂停操作。"));
        }
        if credential_reference(&transaction, &agent)?.is_none()
            && state.status != AgentRuntimeStatus::Protected
        {
            state.status = AgentRuntimeStatus::NeedsConfiguration;
            state.detail = None;
            state.next_wake_at = None;
        }
        if matches!(
            state.status,
            AgentRuntimeStatus::Paused
                | AgentRuntimeStatus::Protected
                | AgentRuntimeStatus::NeedsConfiguration
        ) {
            state.next_wake_at = None;
            transaction.execute(
                "DELETE FROM runtime_plans WHERE agent_id=?1",
                [&state.agent_id],
            )?;
        }
        state.requests_today = current.requests_today;
        if same_state(&current, &state) {
            transaction.commit()?;
            return Ok(None);
        }
        write_state(&transaction, &state)?;
        let event = state_event(&transaction, &state, &generation)?;
        transaction.commit()?;
        Ok(Some(event))
    }

    pub fn set_runtime_paused(
        &mut self,
        id: &str,
        paused: bool,
    ) -> AppResult<(AgentRuntimeState, Option<DomainEvent>)> {
        validate_id(id, "agent_id")?;
        let generation = self.generation_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let agent = read_agent(&transaction, id)?;
        let current = read_runtime_state(&transaction, &agent, now_ms())?;
        let state = AgentRuntimeState {
            agent_id: id.to_owned(),
            config_revision: agent.revision.clone(),
            status: if paused {
                AgentRuntimeStatus::Paused
            } else if credential_reference(&transaction, &agent)?.is_some() {
                AgentRuntimeStatus::Observing
            } else {
                AgentRuntimeStatus::NeedsConfiguration
            },
            detail: None,
            next_wake_at: None,
            requests_today: current.requests_today,
        };
        transaction.execute("DELETE FROM runtime_plans WHERE agent_id=?1", [id])?;
        write_state(&transaction, &state)?;
        let event = if same_state(&current, &state) {
            None
        } else {
            Some(state_event(&transaction, &state, &generation)?)
        };
        transaction.commit()?;
        Ok((state, event))
    }

    pub fn reserve_runtime_request(&mut self, owner: &str, daily_limit: u32) -> AppResult<u32> {
        self.reserve_runtime_request_at(owner, daily_limit, now_ms())
    }

    fn reserve_runtime_request_at(
        &mut self,
        owner: &str,
        daily_limit: u32,
        now: i64,
    ) -> AppResult<u32> {
        validate_id(owner, "requester_id")?;
        if !(1..=5000).contains(&daily_limit) {
            return Err(AppError::invalid(
                "daily_limit",
                "每日请求上限必须在 1～5000 之间。",
            ));
        }
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let limit = if let Some(profile_id) = owner.strip_prefix("test:") {
            validate_id(profile_id, "profile_id")?;
            let exists: bool = transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM model_profiles WHERE id=?1)",
                [profile_id],
                |row| row.get(0),
            )?;
            if !exists {
                return Err(AppError::invalid("profile_id", "模型预设不存在。"));
            }
            daily_limit.min(20)
        } else {
            daily_limit.min(DAILY_REQUEST_LIMIT)
        };
        let day = now.div_euclid(UTC_DAY_MS);
        let current = count_today(&transaction, owner, now)?;
        if current >= limit {
            return Err(AppError::new(
                ErrorCode::Backpressure,
                format!("今日模型请求已达 {limit} 次上限，等待下一个 UTC 日。"),
            ));
        }
        transaction.execute(
            "INSERT INTO runtime_request_counts(requester_id,utc_day,requests) VALUES (?1,?2,1) ON CONFLICT(requester_id,utc_day) DO UPDATE SET requests=requests+1",
            params![owner, day],
        )?;
        transaction.commit()?;
        Ok(current + 1)
    }

    pub fn save_runtime_plan(
        &mut self,
        id: &str,
        revision: DecimalString,
        next: Option<i64>,
        chain_id: String,
    ) -> AppResult<()> {
        validate_id(id, "agent_id")?;
        validate_id(&chain_id, "chain_id")?;
        validate_timestamp(next)?;
        let revision = parse_counter(&revision, "config_revision")?;
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let valid: bool = transaction.query_row(
            "SELECT EXISTS(SELECT 1 FROM agent_configurations a LEFT JOIN agent_runtime_states s ON s.agent_id=a.agent_id WHERE a.agent_id=?1 AND a.active_revision=?2 AND COALESCE(s.status,'offline') NOT IN ('paused','protected'))",
            params![id, revision], |row| row.get(0),
        )?;
        if !valid {
            return Ok(());
        }
        if let Some(next) = next {
            transaction.execute(
                "INSERT INTO runtime_plans VALUES (?1,?2,?3,?4) ON CONFLICT(agent_id) DO UPDATE SET config_revision=excluded.config_revision,next_wake_at=excluded.next_wake_at,chain_id=excluded.chain_id",
                params![id, revision, next, chain_id],
            )?;
        } else {
            transaction.execute("DELETE FROM runtime_plans WHERE agent_id=?1", [id])?;
        }
        transaction.execute(
            "UPDATE agent_runtime_states SET next_wake_at=?1 WHERE agent_id=?2 AND config_revision=?3",
            params![next, id, revision],
        )?;
        transaction.commit()?;
        Ok(())
    }

    pub fn runtime_plan(&self, id: &str) -> AppResult<Option<(i64, String, DecimalString)>> {
        validate_id(id, "agent_id")?;
        Ok(self.conn.query_row(
            "SELECT p.next_wake_at,p.chain_id,p.config_revision FROM runtime_plans p JOIN agent_configurations a ON a.agent_id=p.agent_id AND a.active_revision=p.config_revision LEFT JOIN agent_runtime_states s ON s.agent_id=p.agent_id WHERE p.agent_id=?1 AND COALESCE(s.status,'offline') NOT IN ('paused','protected')",
            [id], |row| Ok((row.get(0)?, row.get(1)?, row.get::<_,i64>(2)?.into())),
        ).optional()?)
    }

    pub fn reserve_runtime_wake(&mut self, id: &str) -> AppResult<Option<i64>> {
        self.reserve_runtime_wake_at(id, now_ms())
    }

    fn reserve_runtime_wake_at(&mut self, id: &str, now: i64) -> AppResult<Option<i64>> {
        validate_id(id, "agent_id")?;
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        read_agent(&transaction, id)?;
        let (count, earliest): (u32, Option<i64>) = transaction.query_row(
            "SELECT COUNT(*),MIN(reserved_at) FROM runtime_wake_log WHERE agent_id=?1 AND reserved_at>?2",
            params![id, now.saturating_sub(HOUR_MS)], |row| Ok((row.get(0)?, row.get(1)?)),
        )?;
        if count >= 2 {
            return Ok(Some(earliest.unwrap_or(now).saturating_add(HOUR_MS)));
        }
        transaction.execute(
            "DELETE FROM runtime_wake_log WHERE agent_id=?1 AND reserved_at<=?2",
            params![id, now.saturating_sub(HOUR_MS)],
        )?;
        transaction.execute(
            "INSERT INTO runtime_wake_log(agent_id,reserved_at) VALUES (?1,?2)",
            params![id, now],
        )?;
        transaction.commit()?;
        Ok(None)
    }

    pub fn runtime_chain(&self, message_seq: DecimalString) -> AppResult<String> {
        let seq = parse_counter(&message_seq, "message_seq")?;
        self.conn.query_row(
            "SELECT COALESCE((SELECT chain_id FROM runtime_messages WHERE message_seq=?1),(SELECT message_id FROM runtime_message_activity WHERE message_seq=?1),(SELECT id FROM messages WHERE seq=?1))",
            [seq], |row| row.get::<_,Option<String>>(0),
        )?.ok_or_else(|| AppError::new(ErrorCode::MessageNotFound, "话题根消息不存在。"))
    }

    pub fn commit_runtime_message(
        &mut self,
        message: RuntimeMessage,
    ) -> AppResult<(ChatSendResult, Option<DomainEvent>)> {
        self.commit_runtime_message_at(message, now_ms())
    }

    fn commit_runtime_message_at(
        &mut self,
        message: RuntimeMessage,
        now: i64,
    ) -> AppResult<(ChatSendResult, Option<DomainEvent>)> {
        cancelled(&message.cancellation)?;
        validate_id(&message.agent_id, "agent_id")?;
        validate_id(&message.decision_id, "decision_id")?;
        validate_id(&message.chain_id, "chain_id")?;
        let revision = parse_counter(&message.config_revision, "config_revision")?;
        let observed = parse_counter(&message.observed_through_seq, "observed_through_seq")?;
        let observed_epoch =
            parse_counter(&message.observed_content_epoch, "observed_content_epoch")?;
        let text = validate_message_content(
            &message.parts,
            &message.quote_message_id,
            &message.mention_ids,
        )?;
        let hash = fingerprint(&serde_json::to_vec(&(
            &message.agent_id,
            &message.config_revision,
            &message.observed_through_seq,
            &message.observed_content_epoch,
            &message.observed_experience_revision,
            &message.chain_id,
            &message.parts,
            &message.quote_message_id,
            &message.mention_ids,
            message.mention_all,
        ))?);
        let generation = self.generation_id.clone();
        let room_id = self.room_id.clone();
        let root = self.root.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let replay: Option<(String, String, i64, i64)> = transaction.query_row(
            "SELECT payload_hash,message_id,message_seq,event_seq FROM runtime_messages WHERE decision_id=?1 AND ordinal=?2",
            params![message.decision_id,message.ordinal], |row| Ok((row.get(0)?,row.get(1)?,row.get(2)?,row.get(3)?)),
        ).optional()?;
        if let Some((stored_hash, message_id, seq, event_seq)) = replay {
            if stored_hash != hash {
                return Err(AppError::new(
                    ErrorCode::IdempotencyConflict,
                    "智能体决策标识已用于其他内容。",
                ));
            }
            return Ok((
                ChatSendResult {
                    data_generation_id: generation,
                    message_id,
                    message_seq: seq.into(),
                    event_seq: event_seq.into(),
                },
                None,
            ));
        }
        let current_epoch: i64 = transaction.query_row(
            "SELECT content_epoch FROM room WHERE singleton=1",
            [],
            |row| row.get(0),
        )?;
        let (_, experience_revision) = super::experience::read_snapshot(&root, &message.agent_id)?;
        if current_epoch != observed_epoch || experience_revision != message.observed_experience_revision {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "历史或经历已改变，旧候选已丢弃。",
            ));
        }
        let agent = read_agent(&transaction, &message.agent_id)?;
        let state = read_runtime_state(&transaction, &agent, now)?;
        if parse_counter(&agent.revision, "config_revision")? != revision {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "智能体配置已更新，旧候选已丢弃。",
            ));
        }
        if matches!(
            state.status,
            AgentRuntimeStatus::Paused | AgentRuntimeStatus::Protected
        ) {
            return Err(AppError::new(
                ErrorCode::PermissionDenied,
                "智能体已暂停或受保护，候选未发送。",
            ));
        }
        if credential_reference(&transaction, &agent)?.is_none() {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "当前模型或凭据不再有效，候选已丢弃。",
            ));
        }
        let inconsistent_decision: bool = transaction.query_row(
            "SELECT EXISTS(SELECT 1 FROM runtime_messages WHERE decision_id=?1 AND (agent_id<>?2 OR config_revision<>?3 OR observed_through_seq<>?4 OR chain_id<>?5))",
            params![message.decision_id,message.agent_id,revision,observed,message.chain_id], |row| row.get(0),
        )?;
        if inconsistent_decision {
            return Err(AppError::new(
                ErrorCode::IdempotencyConflict,
                "同一决策的分条身份或观察范围不一致。",
            ));
        }
        if observed > allocated_seq(&transaction, "messages")? {
            return Err(AppError::invalid(
                "observed_through_seq",
                "观察消息序号超出当前历史。",
            ));
        }
        if agent.agent_type == AgentType::Tool {
            let origin = tool_origin(&transaction, &room_id, &message.agent_id, observed)?;
            if origin.is_none() || origin != message.quote_message_id || message.ordinal != 0
                || message.decision_id != tool_decision_id(&message.agent_id, &message.observed_through_seq)
                || !message.mention_ids.is_empty() || message.mention_all
            {
                return Err(AppError::new(ErrorCode::ConfigConflict, "工具答复只能绑定有效的原委托。"));
            }
        } else {
            let external_message: bool = transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM runtime_message_activity WHERE message_seq>?1 AND (decision_id IS NULL OR decision_id<>?2 OR sender_id<>?3))",
                params![observed,message.decision_id,message.agent_id], |row| row.get(0),
            )?;
            if external_message {
                return Err(AppError::new(ErrorCode::ConfigConflict, "有新的外部消息，旧候选已丢弃。"));
            }
        }
        if let Some(quote) = &message.quote_message_id {
            let visible: bool = transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM messages WHERE id=?1 AND room_id=?2 AND state='visible' AND seq<=?3)",
                params![quote,room_id,observed], |row| row.get(0),
            )?;
            if !visible {
                return Err(AppError::new(
                    ErrorCode::MessageNotFound,
                    "引用必须是已观察到的可见消息。",
                ));
            }
        }
        let chain_count: u32 = transaction.query_row(
            "SELECT COUNT(DISTINCT decision_id) FROM runtime_messages WHERE chain_id=?1 AND committed_at>?2",
            params![&message.chain_id, now.saturating_sub(CHAIN_WINDOW_MS)],
            |row| row.get(0),
        )?;
        let continuing_decision: bool = transaction.query_row(
            "SELECT EXISTS(SELECT 1 FROM runtime_messages WHERE decision_id=?1)",
            [&message.decision_id],
            |row| row.get(0),
        )?;
        let minute_count: u32 = transaction.query_row(
            "SELECT COUNT(*) FROM runtime_messages WHERE committed_at>?1",
            [now.saturating_sub(MINUTE_MS)],
            |row| row.get(0),
        )?;
        let hour_count: u32 = transaction.query_row(
            "SELECT COUNT(*) FROM runtime_messages WHERE committed_at>?1",
            [now.saturating_sub(HOUR_MS)],
            |row| row.get(0),
        )?;
        let limit_detail = if chain_count >= 20 && !continuing_decision {
            Some("该话题最近 30 分钟已回复 20 回合，稍后自动恢复。")
        } else if minute_count >= 40 {
            Some("自动消息最近一分钟已发送 40 条，稍后自动恢复。")
        } else if hour_count >= 400 {
            Some("自动消息最近一小时已发送 400 条，稍后自动恢复。")
        } else {
            None
        };
        if let Some(detail) = limit_detail {
            return Err(AppError::new(ErrorCode::Backpressure, detail));
        }
        let (result, event) = insert_message(
            &transaction,
            &generation,
            &room_id,
            &message.agent_id,
            &message.parts,
            &message.quote_message_id,
            &message.mention_ids,
            message.mention_all,
            &text,
        )?;
        transaction.execute(
            "INSERT INTO runtime_messages(decision_id,ordinal,agent_id,config_revision,observed_through_seq,chain_id,message_id,message_seq,event_seq,committed_at,payload_hash) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![message.decision_id,message.ordinal,message.agent_id,revision,observed,message.chain_id,result.message_id,parse_counter(&result.message_seq,"message_seq")?,parse_counter(&result.event_seq,"event_seq")?,now,hash],
        )?;
        transaction.execute(
            "UPDATE runtime_message_activity SET decision_id=?1 WHERE message_seq=?2",
            params![
                message.decision_id,
                parse_counter(&result.message_seq, "message_seq")?
            ],
        )?;
        cancelled(&message.cancellation)?;
        transaction.commit()?;
        // 自动消息也记录撤回时间锚，供智能体在三分钟内自我更正。
        self.recall_anchors
            .retain(|_, anchor| anchor.elapsed() < RECALL_WINDOW);
        self.recall_anchors
            .insert(result.message_id.clone(), Instant::now());
        Ok((result, Some(event)))
    }
}

#[cfg(test)]
#[path = "runtime_tests.rs"]
mod tests;
