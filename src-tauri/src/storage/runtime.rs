use rusqlite::{Connection, OptionalExtension, Transaction, TransactionBehavior, params};
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

use crate::domain::{
    contracts::*,
    error::{AppResult, now_ms, parse_counter, validate_id},
};

use super::{
    chat,
    configuration::require_configured_profile,
    database::{Database, fingerprint},
};

const DAY_MS: i64 = 86_400_000;
const HOUR_MS: i64 = 3_600_000;

pub struct RuntimeInput {
    pub agent: AgentConfiguration,
    pub credential_ref: String,
    pub snapshot: AppSnapshot,
    pub messages: Vec<ChatMessage>,
}

pub struct RuntimeMessage {
    pub agent_id: String,
    pub config_revision: DecimalString,
    pub observed_through_seq: DecimalString,
    pub decision_id: String,
    pub ordinal: u32,
    pub chain_id: String,
    pub parts: Vec<MessagePart>,
    pub quote_message_id: Option<String>,
    pub mention_ids: Vec<String>,
    pub mention_all: bool,
    pub cancellation: CancellationToken,
}

fn agent_configuration(conn: &Connection, id: &str) -> AppResult<AgentConfiguration> {
    validate_id(id, "agent_id")?;
    let json: String = conn.query_row(
        "SELECT v.configuration_json FROM agent_configurations a JOIN agent_config_versions v ON v.agent_id=a.agent_id AND v.revision=a.active_revision WHERE a.agent_id=?1",
        [id], |row| row.get(0),
    )?;
    Ok(serde_json::from_str(&json)?)
}

fn stored_runtime(conn: &Connection, id: &str) -> AppResult<Option<AgentRuntimeState>> {
    let json: Option<String> = conn
        .query_row(
            "SELECT state_json FROM agent_runtime WHERE agent_id=?1",
            [id],
            |row| row.get(0),
        )
        .optional()?;
    json.map(|json| serde_json::from_str(&json).map_err(Into::into))
        .transpose()
}

fn request_count(conn: &Connection, id: &str, now: i64) -> AppResult<u32> {
    Ok(conn.query_row(
        "SELECT COUNT(*) FROM runtime_requests WHERE requester_id=?1 AND occurred_at>=?2",
        params![id, now.div_euclid(DAY_MS) * DAY_MS],
        |row| row.get(0),
    )?)
}

pub(crate) fn read_runtime(conn: &Connection, id: &str) -> AppResult<Option<AgentRuntimeState>> {
    let mut state = stored_runtime(conn, id)?;
    if let Some(state) = &mut state {
        state.requests_today = request_count(conn, id, now_ms())?;
    }
    Ok(state)
}

fn paused(conn: &Connection, id: &str) -> AppResult<bool> {
    Ok(conn
        .query_row(
            "SELECT paused FROM agent_runtime WHERE agent_id=?1",
            [id],
            |row| row.get(0),
        )
        .optional()?
        .unwrap_or(false))
}

fn check_active(
    conn: &Connection,
    id: &str,
    revision: &DecimalString,
) -> AppResult<AgentConfiguration> {
    let agent = agent_configuration(conn, id)?;
    if agent.revision != *revision {
        return Err(AppError::new(
            ErrorCode::ConfigConflict,
            "成员配置已改变，旧动作未提交。",
        ));
    }
    if paused(conn, id)? {
        return Err(AppError::new(
            ErrorCode::ShuttingDown,
            "成员已暂停，旧动作未提交。",
        ));
    }
    Ok(agent)
}

fn configured_credential(conn: &Connection, agent: &AgentConfiguration) -> AppResult<String> {
    if agent.agent_type != AgentType::Social {
        return Err(AppError::new(
            ErrorCode::CapabilityUnsupported,
            "工具成员不参与自主闲聊。",
        ));
    }
    let model = agent
        .model
        .as_ref()
        .ok_or_else(|| AppError::new(ErrorCode::CapabilityUnsupported, "成员尚未配置模型。"))?;
    require_configured_profile(&model.profile)?;
    let (json, reference): (String, Option<String>) = conn.query_row(
        "SELECT p.profile_json,b.reference FROM model_profiles p LEFT JOIN credential_bindings b ON b.reference=p.credential_ref AND b.profile_id=p.id AND b.endpoint=json_extract(p.profile_json,'$.base_url') AND b.protocol=json_extract(p.profile_json,'$.protocol') WHERE p.id=?1",
        [&model.source_profile_id], |row| Ok((row.get(0)?, row.get(1)?)),
    ).optional()?.ok_or_else(|| AppError::new(ErrorCode::CapabilityUnsupported, "来源模型预设已删除。"))?;
    let profile: ModelProfileInput = serde_json::from_str(&json)?;
    if profile.base_url != model.profile.base_url || profile.protocol != model.profile.protocol {
        return Err(AppError::new(
            ErrorCode::CapabilityUnsupported,
            "来源模型的凭据端点或协议已改变，请重新采用预设。",
        ));
    }
    reference.ok_or_else(|| {
        AppError::new(
            ErrorCode::CapabilityUnsupported,
            "来源模型尚未设置有效凭据。",
        )
    })
}

fn save_state(
    transaction: &Transaction<'_>,
    state: AgentRuntimeState,
    is_paused: bool,
    generation: &str,
) -> AppResult<(AgentRuntimeState, Option<DomainEvent>)> {
    let unchanged = stored_runtime(transaction, &state.agent_id)?.as_ref() == Some(&state)
        && paused(transaction, &state.agent_id)? == is_paused;
    transaction.execute(
        "INSERT INTO agent_runtime(agent_id,config_revision,state_json,paused) VALUES (?1,?2,?3,?4) ON CONFLICT(agent_id) DO UPDATE SET config_revision=excluded.config_revision,state_json=excluded.state_json,paused=excluded.paused",
        params![state.agent_id, parse_counter(&state.config_revision, "config_revision")?, serde_json::to_string(&state)?, is_paused],
    )?;
    let status = if matches!(
        state.status,
        AgentRuntimeStatus::NeedsConfiguration | AgentRuntimeStatus::Offline
    ) {
        ParticipantStatus::NeedsConfiguration
    } else {
        ParticipantStatus::Present
    };
    transaction.execute(
        "UPDATE participants SET status=?1 WHERE id=?2",
        params![serde_json::to_value(&status)?.as_str(), state.agent_id],
    )?;
    let event = if unchanged {
        None
    } else {
        let (display_name, introduction, is_builtin, avatar_id, profile_revision) = transaction.query_row(
            "SELECT display_name,introduction,builtin_key IS NOT NULL,avatar_id,profile_revision FROM participants WHERE id=?1",
            [&state.agent_id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get::<_, i64>(4)?)),
        )?;
        Some(chat::record_event(
            transaction,
            EventPayload::ParticipantProfileChanged {
                participant: Participant {
                    id: state.agent_id.clone(),
                    kind: ParticipantKind::Agent,
                    display_name,
                    introduction,
                    status,
                    is_builtin,
                    avatar_id,
                    profile_revision: profile_revision.into(),
                    runtime: Some(state.clone()),
                },
            },
            generation,
        )?)
    };
    Ok((state, event))
}

impl Database {
    pub fn runtime_states(&self) -> AppResult<Vec<AgentRuntimeState>> {
        let ids = self
            .conn
            .prepare("SELECT agent_id FROM agent_runtime ORDER BY agent_id")?
            .query_map([], |row| row.get::<_, String>(0))?
            .collect::<rusqlite::Result<Vec<_>>>()?;
        ids.into_iter()
            .map(|id| {
                read_runtime(&self.conn, &id)?
                    .ok_or_else(|| AppError::new(ErrorCode::InternalError, "成员运行状态缺失。"))
            })
            .collect()
    }

    pub fn runtime_is_paused(&self, id: &str) -> AppResult<bool> {
        agent_configuration(&self.conn, id)?;
        paused(&self.conn, id)
    }

    pub fn set_runtime_state(
        &mut self,
        state: AgentRuntimeState,
    ) -> AppResult<(AgentRuntimeState, Option<DomainEvent>)> {
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        check_active(&transaction, &state.agent_id, &state.config_revision)?;
        let result = save_state(&transaction, state, false, &self.generation_id)?;
        transaction.commit()?;
        Ok(result)
    }

    pub fn set_runtime_paused(
        &mut self,
        id: &str,
        is_paused: bool,
    ) -> AppResult<(AgentRuntimeState, Option<DomainEvent>)> {
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let agent = agent_configuration(&transaction, id)?;
        let state = AgentRuntimeState {
            agent_id: id.into(),
            config_revision: agent.revision,
            status: if is_paused {
                AgentRuntimeStatus::Paused
            } else if agent.model.is_some() && agent.agent_type == AgentType::Social {
                AgentRuntimeStatus::Observing
            } else {
                AgentRuntimeStatus::NeedsConfiguration
            },
            detail: None,
            next_wake_at: None,
            requests_today: request_count(&transaction, id, now_ms())?,
        };
        transaction.execute("DELETE FROM runtime_plans WHERE agent_id=?1", [id])?;
        let result = save_state(&transaction, state, is_paused, &self.generation_id)?;
        transaction.commit()?;
        Ok(result)
    }

    pub fn runtime_input(&mut self, id: &str) -> AppResult<RuntimeInput> {
        let agent = agent_configuration(&self.conn, id)?;
        check_active(&self.conn, id, &agent.revision)?;
        let credential_ref = configured_credential(&self.conn, &agent)?;
        let snapshot = self.snapshot(AppSnapshotRequest {
            data_generation_id: None,
            last_event_seq: None,
        })?;
        let messages = self
            .list_messages(ChatListRequest {
                data_generation_id: self.generation_id.clone(),
                before_seq: None,
                after_seq: None,
                around_seq: None,
                limit: DEFAULT_PAGE_SIZE,
            })?
            .items;
        Ok(RuntimeInput {
            agent,
            credential_ref,
            snapshot,
            messages,
        })
    }

    pub fn runtime_plan(&self, id: &str) -> AppResult<Option<(i64, String, DecimalString)>> {
        let plan: Option<(i64, String, i64)> = self
            .conn
            .query_row(
                "SELECT next_wake_at,chain_id,config_revision FROM runtime_plans WHERE agent_id=?1",
                [id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()?;
        Ok(plan.map(|(at, chain, revision)| (at, chain, revision.into())))
    }

    pub fn save_runtime_plan(
        &mut self,
        id: &str,
        revision: &DecimalString,
        at: Option<i64>,
        chain: &str,
    ) -> AppResult<()> {
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let agent = check_active(&transaction, id, revision)?;
        if let Some(at) = at {
            validate_id(chain, "chain_id")?;
            if !agent.preferences.allow_autonomous_wake {
                return Err(AppError::new(
                    ErrorCode::CapabilityUnsupported,
                    "成员未允许自主唤醒。",
                ));
            }
            transaction.execute(
                "INSERT INTO runtime_plans VALUES (?1,?2,?3,?4) ON CONFLICT(agent_id) DO UPDATE SET config_revision=excluded.config_revision,next_wake_at=excluded.next_wake_at,chain_id=excluded.chain_id",
                params![id, parse_counter(revision, "config_revision")?, at, chain],
            )?;
        } else {
            transaction.execute("DELETE FROM runtime_plans WHERE agent_id=?1", [id])?;
        }
        transaction.commit()?;
        Ok(())
    }

    pub fn reserve_runtime_request(&mut self, id: &str, limit: u32) -> AppResult<u32> {
        validate_id(id, "requester_id")?;
        let now = now_ms();
        let day = now.div_euclid(DAY_MS) * DAY_MS;
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        transaction.execute("DELETE FROM runtime_requests WHERE occurred_at<?1", [day])?;
        let count = request_count(&transaction, id, now)?;
        let total: u32 =
            transaction.query_row("SELECT COUNT(*) FROM runtime_requests", [], |row| {
                row.get(0)
            })?;
        if count >= limit || total >= 500 {
            return Err(AppError::new(
                ErrorCode::Backpressure,
                "今日模型请求已达到保护上限，请在下一个 UTC 日窗口再试。",
            ));
        }
        transaction.execute(
            "INSERT INTO runtime_requests(requester_id,occurred_at) VALUES (?1,?2)",
            params![id, now],
        )?;
        transaction.commit()?;
        Ok(count + 1)
    }

    pub fn reserve_runtime_wake(&mut self, id: &str) -> AppResult<Option<i64>> {
        let now = now_ms();
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let agent = agent_configuration(&transaction, id)?;
        check_active(&transaction, id, &agent.revision)?;
        if !agent.preferences.allow_autonomous_wake {
            return Err(AppError::new(
                ErrorCode::CapabilityUnsupported,
                "成员未允许自主唤醒。",
            ));
        }
        transaction.execute(
            "DELETE FROM runtime_wakes WHERE occurred_at<=?1",
            [now - HOUR_MS],
        )?;
        let (count, earliest): (u32, Option<i64>) = transaction.query_row(
            "SELECT COUNT(*),MIN(occurred_at) FROM runtime_wakes WHERE agent_id=?1",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;
        if count >= 2 {
            return Ok(earliest.map(|at| at + HOUR_MS));
        }
        transaction.execute(
            "INSERT INTO runtime_wakes(agent_id,occurred_at) VALUES (?1,?2)",
            params![id, now],
        )?;
        transaction.commit()?;
        Ok(None)
    }

    pub fn runtime_chain(&self, seq: &DecimalString) -> AppResult<String> {
        let seq = parse_counter(seq, "message_seq")?;
        let chain: Option<String> = self
            .conn
            .query_row(
                "SELECT chain_id FROM runtime_message_commits WHERE message_seq=?1",
                [seq],
                |row| row.get(0),
            )
            .optional()?;
        if let Some(chain) = chain {
            return Ok(chain);
        }
        let id: Option<String> = self
            .conn
            .query_row("SELECT id FROM messages WHERE seq=?1", [seq], |row| {
                row.get(0)
            })
            .optional()?;
        Ok(id.unwrap_or_else(|| Uuid::now_v7().to_string()))
    }

    pub fn commit_runtime_message(
        &mut self,
        message: RuntimeMessage,
    ) -> AppResult<(ChatSendResult, Option<DomainEvent>)> {
        validate_id(&message.decision_id, "decision_id")?;
        validate_id(&message.chain_id, "chain_id")?;
        let observed = parse_counter(&message.observed_through_seq, "observed_through_seq")?;
        let revision = parse_counter(&message.config_revision, "config_revision")?;
        let hash = fingerprint(&serde_json::to_vec(&(
            &message.agent_id,
            &message.config_revision,
            &message.observed_through_seq,
            &message.chain_id,
            &message.parts,
            &message.quote_message_id,
            &message.mention_ids,
            message.mention_all,
        ))?);
        let transaction = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let previous: Option<(String, String, i64, i64)> = transaction.query_row(
            "SELECT payload_hash,m.id,c.message_seq,c.event_seq FROM runtime_message_commits c JOIN messages m ON m.seq=c.message_seq WHERE c.decision_id=?1 AND c.ordinal=?2",
            params![message.decision_id, message.ordinal], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        ).optional()?;
        if let Some((previous_hash, message_id, message_seq, event_seq)) = previous {
            if hash != previous_hash {
                return Err(AppError::new(
                    ErrorCode::IdempotencyConflict,
                    "此决策动作已用于其他内容，未重复提交。",
                ));
            }
            return Ok((
                ChatSendResult {
                    data_generation_id: self.generation_id.clone(),
                    message_id,
                    message_seq: message_seq.into(),
                    event_seq: event_seq.into(),
                },
                None,
            ));
        }
        if message.cancellation.is_cancelled() {
            return Err(AppError::new(ErrorCode::ShuttingDown, "待发消息已取消。"));
        }
        let agent = check_active(&transaction, &message.agent_id, &message.config_revision)?;
        configured_credential(&transaction, &agent)?;
        let external: bool = transaction.query_row(
            "SELECT EXISTS(SELECT 1 FROM messages m WHERE m.seq>?1 AND NOT EXISTS(SELECT 1 FROM runtime_message_commits c WHERE c.message_seq=m.seq AND c.decision_id=?2))",
            params![observed, message.decision_id], |row| row.get(0),
        )?;
        if external {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "观察后有新的外部消息，旧动作未提交。",
            ));
        }
        if let Some(id) = &message.quote_message_id {
            let visible: bool = transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM messages WHERE id=?1 AND seq<=?2 AND state='visible')",
                params![id, observed],
                |row| row.get(0),
            )?;
            if !visible {
                return Err(AppError::new(
                    ErrorCode::MessageNotFound,
                    "被引用消息已不可见，旧动作未提交。",
                ));
            }
        }
        let (chain, minute, hour): (u32, u32, u32) = transaction.query_row(
            "SELECT COALESCE(SUM(c.chain_id=?1),0),COALESCE(SUM(m.created_at>?2),0),COALESCE(SUM(m.created_at>?3),0) FROM runtime_message_commits c JOIN messages m ON m.seq=c.message_seq",
            params![message.chain_id, now_ms() - 60_000, now_ms() - HOUR_MS],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )?;
        if chain >= 20 || minute >= 12 || hour >= 120 {
            return Err(AppError::new(
                ErrorCode::Backpressure,
                "自动消息已达到链路或滚动窗口保护上限。",
            ));
        }
        let (result, event) = chat::commit_message(
            &transaction,
            &self.room_id,
            &message.agent_id,
            &message.parts,
            &message.quote_message_id,
            &message.mention_ids,
            message.mention_all,
            &self.generation_id,
        )?;
        transaction.execute(
            "INSERT INTO runtime_message_commits(decision_id,ordinal,agent_id,config_revision,observed_through_seq,chain_id,payload_hash,message_seq,event_seq) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            params![message.decision_id, message.ordinal, message.agent_id, revision, observed, message.chain_id,
                hash, parse_counter(&result.message_seq, "message_seq")?, parse_counter(&result.event_seq, "event_seq")?],
        )?;
        if message.cancellation.is_cancelled() {
            return Err(AppError::new(ErrorCode::ShuttingDown, "待发消息已取消。"));
        }
        transaction.commit()?;
        Ok((result, Some(event)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn configured() -> (TempDir, Database, AgentConfiguration) {
        let dir = TempDir::new().unwrap();
        let mut db = Database::open(dir.path(), "runtime-test".into()).unwrap();
        let global = db.get_global_configuration("runtime-test").unwrap();
        let profile = ModelProfileInput {
            id: "runtime-model".into(),
            name: "运行测试".into(),
            protocol: ModelProtocol::OpenaiChatCompletions,
            base_url: "http://127.0.0.1:1/v1".into(),
            model_name: "fixture".into(),
            parameters: ModelParameters {
                temperature: 0.5,
                top_p: 1.0,
                max_output_tokens: 1024,
                input_budget: 4096,
                reasoning: ReasoningMode::Off,
            },
        };
        let global = db
            .save_global_configuration(GlobalConfigurationSaveRequest {
                data_generation_id: "runtime-test".into(),
                client_request_id: Uuid::now_v7().to_string(),
                expected_revision: global.revision,
                model_profiles: vec![profile],
                persona_presets: global.persona_presets,
                runtime_defaults: global.runtime_defaults,
            })
            .unwrap()
            .0;
        db.replace_credential_reference(
            "runtime-model",
            &global.model_profiles[0].revision,
            Some(Uuid::now_v7().to_string()),
        )
        .unwrap();
        let mut agent = db.list_agents("runtime-test").unwrap().remove(0);
        let revision = agent.revision.clone();
        agent.preferences.allow_autonomous_wake = true;
        agent.model = Some(AgentModelSnapshot {
            source_profile_id: "runtime-model".into(),
            source_profile_revision: global.model_profiles[0].revision.clone(),
            profile: global.model_profiles[0].input(),
        });
        let agent = db
            .save_agent(AgentSaveRequest {
                data_generation_id: "runtime-test".into(),
                client_request_id: Uuid::now_v7().to_string(),
                expected_revision: Some(revision),
                configuration: agent,
            })
            .unwrap()
            .0;
        (dir, db, agent)
    }

    fn candidate(
        agent: &AgentConfiguration,
        observed: i64,
        decision: &str,
        ordinal: u32,
    ) -> RuntimeMessage {
        RuntimeMessage {
            agent_id: agent.agent_id.clone(),
            config_revision: agent.revision.clone(),
            observed_through_seq: observed.into(),
            decision_id: decision.into(),
            ordinal,
            chain_id: "chain-test".into(),
            parts: vec![MessagePart::Text {
                text: "智能体消息".into(),
            }],
            quote_message_id: None,
            mention_ids: vec![],
            mention_all: false,
            cancellation: CancellationToken::new(),
        }
    }

    fn user_message(db: &mut Database) -> ChatSendResult {
        db.send_message(ChatSendRequest {
            data_generation_id: "runtime-test".into(),
            client_request_id: Uuid::now_v7().to_string(),
            parts: vec![MessagePart::Text {
                text: "用户新消息".into(),
            }],
            quote_message_id: None,
            mention_ids: vec![],
            mention_all: false,
        })
        .unwrap()
        .0
    }

    #[test]
    fn runtime_input_requires_configuration_bound_credentials_and_unpaused_state() {
        let dir = TempDir::new().unwrap();
        let mut db = Database::open(dir.path(), "runtime-test".into()).unwrap();
        let id = db.list_agents("runtime-test").unwrap()[0].agent_id.clone();
        assert_eq!(
            db.runtime_input(&id).err().unwrap().code,
            ErrorCode::CapabilityUnsupported
        );
        let (_dir, mut db, agent) = configured();
        let input = db.runtime_input(&agent.agent_id).unwrap();
        assert!(!input.credential_ref.is_empty());
        assert_eq!(input.agent.revision, agent.revision);
        db.set_runtime_paused(&agent.agent_id, true).unwrap();
        assert_eq!(
            db.runtime_input(&agent.agent_id).err().unwrap().code,
            ErrorCode::ShuttingDown
        );
        db.set_runtime_paused(&agent.agent_id, false).unwrap();
        db.replace_credential_reference("runtime-model", &1.into(), None)
            .unwrap();
        assert_eq!(
            db.runtime_input(&agent.agent_id).err().unwrap().code,
            ErrorCode::CapabilityUnsupported
        );
    }

    #[test]
    fn states_publish_snapshots_and_reject_old_revisions_after_configuration_changes() {
        let (_dir, mut db, agent) = configured();
        let state = AgentRuntimeState {
            agent_id: agent.agent_id.clone(),
            config_revision: agent.revision.clone(),
            status: AgentRuntimeStatus::Observing,
            detail: None,
            next_wake_at: None,
            requests_today: 0,
        };
        let (_, event) = db.set_runtime_state(state.clone()).unwrap();
        assert!(
            matches!(event.unwrap().payload, EventPayload::ParticipantProfileChanged { participant } if participant.runtime == Some(state.clone()))
        );
        assert!(db.set_runtime_state(state.clone()).unwrap().1.is_none());
        let snapshot = db
            .snapshot(AppSnapshotRequest {
                data_generation_id: None,
                last_event_seq: None,
            })
            .unwrap();
        assert_eq!(
            snapshot
                .participants
                .into_iter()
                .find(|p| p.id == agent.agent_id)
                .unwrap()
                .runtime,
            Some(state.clone())
        );
        db.save_agent(AgentSaveRequest {
            data_generation_id: "runtime-test".into(),
            client_request_id: Uuid::now_v7().to_string(),
            expected_revision: Some(agent.revision.clone()),
            configuration: agent,
        })
        .unwrap();
        assert_eq!(
            db.set_runtime_state(state).unwrap_err().code,
            ErrorCode::ConfigConflict
        );
    }

    #[test]
    fn pause_and_wake_plans_survive_reopen_and_enforce_rolling_hour_limits() {
        let (dir, mut db, agent) = configured();
        let id = &agent.agent_id;
        let at = now_ms() + 300_000;
        db.save_runtime_plan(id, &agent.revision, Some(at), "chain-test")
            .unwrap();
        assert_eq!(db.reserve_runtime_wake(id).unwrap(), None);
        assert_eq!(db.reserve_runtime_wake(id).unwrap(), None);
        assert!(db.reserve_runtime_wake(id).unwrap().unwrap() > now_ms());
        drop(db);
        let mut db = Database::open(dir.path(), "runtime-test".into()).unwrap();
        assert_eq!(
            db.runtime_plan(id).unwrap(),
            Some((at, "chain-test".into(), agent.revision.clone()))
        );
        db.set_runtime_paused(id, true).unwrap();
        assert!(db.runtime_plan(id).unwrap().is_none());
        drop(db);
        let mut db = Database::open(dir.path(), "runtime-test".into()).unwrap();
        assert!(db.runtime_is_paused(id).unwrap());
        assert_eq!(
            db.save_runtime_plan(id, &agent.revision, Some(at), "chain-test")
                .unwrap_err()
                .code,
            ErrorCode::ShuttingDown
        );
        db.set_runtime_paused(id, false).unwrap();
        db.conn
            .execute(
                "UPDATE runtime_wakes SET occurred_at=?1",
                [now_ms() - HOUR_MS - 1],
            )
            .unwrap();
        assert_eq!(db.reserve_runtime_wake(id).unwrap(), None);
    }

    #[test]
    fn daily_request_budgets_are_persistent_global_and_reset_only_at_utc_day_boundary() {
        let (dir, mut db, agent) = configured();
        assert_eq!(db.reserve_runtime_request(&agent.agent_id, 2).unwrap(), 1);
        assert_eq!(db.reserve_runtime_request(&agent.agent_id, 2).unwrap(), 2);
        assert_eq!(
            db.reserve_runtime_request(&agent.agent_id, 2)
                .unwrap_err()
                .code,
            ErrorCode::Backpressure
        );
        user_message(&mut db);
        drop(db);
        let mut db = Database::open(dir.path(), "runtime-test".into()).unwrap();
        assert_eq!(
            db.reserve_runtime_request(&agent.agent_id, 2)
                .unwrap_err()
                .code,
            ErrorCode::Backpressure
        );
        db.conn
            .execute(
                "UPDATE runtime_requests SET occurred_at=?1",
                [now_ms().div_euclid(DAY_MS) * DAY_MS - 1],
            )
            .unwrap();
        assert_eq!(db.reserve_runtime_request(&agent.agent_id, 2).unwrap(), 1);
        db.conn.execute(
            "WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<499) INSERT INTO runtime_requests(requester_id,occurred_at) SELECT 'other',?1 FROM n",
            [now_ms()],
        ).unwrap();
        assert_eq!(
            db.reserve_runtime_request("test:runtime-model", 20)
                .unwrap_err()
                .code,
            ErrorCode::Backpressure
        );
    }

    #[test]
    fn runtime_messages_keep_agent_identity_search_index_and_idempotency_without_invalidating_own_parts()
     {
        let (dir, mut db, agent) = configured();
        let decision = "decision-test";
        let (first, event) = db
            .commit_runtime_message(candidate(&agent, 0, decision, 0))
            .unwrap();
        assert!(event.is_some());
        let (replay, event) = db
            .commit_runtime_message(candidate(&agent, 0, decision, 0))
            .unwrap();
        assert_eq!(replay.message_id, first.message_id);
        assert!(event.is_none());
        let mut conflicting = candidate(&agent, 0, decision, 0);
        conflicting.parts = vec![MessagePart::Text {
            text: "不同内容".into(),
        }];
        assert_eq!(
            db.commit_runtime_message(conflicting).unwrap_err().code,
            ErrorCode::IdempotencyConflict
        );
        db.commit_runtime_message(candidate(&agent, 0, decision, 1))
            .unwrap();
        let page = db
            .list_messages(ChatListRequest {
                data_generation_id: "runtime-test".into(),
                before_seq: None,
                after_seq: None,
                around_seq: None,
                limit: 50,
            })
            .unwrap();
        assert_eq!(page.items.len(), 2);
        assert!(
            page.items.iter().all(|m| m.sender_id == agent.agent_id
                && m.sender_snapshot.kind == ParticipantKind::Agent)
        );
        let indexed: u32 = db
            .conn
            .query_row(
                "SELECT COUNT(*) FROM message_search WHERE message_search MATCH '智能体'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(indexed, 2);
        assert_eq!(db.runtime_chain(&first.message_seq).unwrap(), "chain-test");
        drop(db);
        let mut db = Database::open(dir.path(), "runtime-test".into()).unwrap();
        assert_eq!(
            db.commit_runtime_message(candidate(&agent, 0, decision, 0))
                .unwrap()
                .0
                .message_id,
            first.message_id
        );
        user_message(&mut db);
        assert_eq!(
            db.commit_runtime_message(candidate(&agent, 0, decision, 2))
                .unwrap_err()
                .code,
            ErrorCode::ConfigConflict
        );
    }

    #[test]
    fn canceled_paused_privileged_or_invalid_messages_never_commit() {
        let (_dir, mut db, agent) = configured();
        let canceled = candidate(&agent, 0, "cancel", 0);
        canceled.cancellation.cancel();
        assert_eq!(
            db.commit_runtime_message(canceled).unwrap_err().code,
            ErrorCode::ShuttingDown
        );
        let mut privileged = candidate(&agent, 0, "privileged", 0);
        privileged.mention_all = true;
        assert_eq!(
            db.commit_runtime_message(privileged).unwrap_err().code,
            ErrorCode::PermissionDenied
        );
        let mut invalid = candidate(&agent, 0, "invalid", 0);
        invalid.parts.clear();
        assert_eq!(
            db.commit_runtime_message(invalid).unwrap_err().code,
            ErrorCode::InvalidInput
        );
        db.set_runtime_paused(&agent.agent_id, true).unwrap();
        assert_eq!(
            db.commit_runtime_message(candidate(&agent, 0, "paused", 0))
                .unwrap_err()
                .code,
            ErrorCode::ShuttingDown
        );
        let count: u32 = db
            .conn
            .query_row("SELECT COUNT(*) FROM messages", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn pending_messages_recheck_credentials_and_source_endpoint_inside_commit() {
        let (_dir, mut db, agent) = configured();
        let pending = candidate(&agent, 0, "deleted-credential", 0);
        db.replace_credential_reference("runtime-model", &1.into(), None)
            .unwrap();
        assert_eq!(
            db.commit_runtime_message(pending).unwrap_err().code,
            ErrorCode::CapabilityUnsupported
        );
        db.replace_credential_reference(
            "runtime-model",
            &1.into(),
            Some(Uuid::now_v7().to_string()),
        )
        .unwrap();
        let pending = candidate(&agent, 0, "changed-endpoint", 0);
        let global = db.get_global_configuration("runtime-test").unwrap();
        let mut profile = global.model_profiles[0].input();
        profile.base_url = "http://127.0.0.1:2/v1".into();
        db.save_global_configuration(GlobalConfigurationSaveRequest {
            data_generation_id: "runtime-test".into(),
            client_request_id: Uuid::now_v7().to_string(),
            expected_revision: global.revision,
            model_profiles: vec![profile],
            persona_presets: global.persona_presets,
            runtime_defaults: global.runtime_defaults,
        })
        .unwrap();
        assert_eq!(
            db.commit_runtime_message(pending).unwrap_err().code,
            ErrorCode::CapabilityUnsupported
        );
        let count: u32 = db
            .conn
            .query_row("SELECT COUNT(*) FROM messages", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn automatic_message_limits_cover_chains_and_global_rolling_windows() {
        let (_dir, mut db, agent) = configured();
        for ordinal in 0..12 {
            let mut message = candidate(&agent, ordinal, &format!("decision-{ordinal}"), 0);
            message.chain_id = format!("chain-{ordinal}");
            db.commit_runtime_message(message).unwrap();
        }
        assert_eq!(
            db.commit_runtime_message(candidate(&agent, 12, "minute-limit", 0))
                .unwrap_err()
                .code,
            ErrorCode::Backpressure
        );
        db.conn
            .execute("UPDATE messages SET created_at=?1", [now_ms() - 120_000])
            .unwrap();
        db.conn
            .execute(
                "UPDATE runtime_message_commits SET chain_id='chain-test'",
                [],
            )
            .unwrap();
        for ordinal in 12..20 {
            db.commit_runtime_message(candidate(
                &agent,
                ordinal,
                &format!("decision-{ordinal}"),
                0,
            ))
            .unwrap();
        }
        assert_eq!(
            db.commit_runtime_message(candidate(&agent, 20, "chain-limit", 0))
                .unwrap_err()
                .code,
            ErrorCode::Backpressure
        );
    }

    #[test]
    fn global_hourly_message_budget_expires_without_resetting_chain_history() {
        let (_dir, mut db, agent) = configured();
        let sender = serde_json::to_string(&SenderSnapshot {
            display_name: agent.display_name.clone(),
            kind: ParticipantKind::Agent,
            avatar_id: None,
        })
        .unwrap();
        db.conn.execute(
            "WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<120) INSERT INTO messages(id,room_id,sender_id,sender_snapshot_json,created_at) SELECT 'hour-fixture-'||x,?1,?2,?3,?4 FROM n",
            params![db.room_id, agent.agent_id, sender, now_ms() - 120_000],
        ).unwrap();
        db.conn.execute(
            "INSERT INTO runtime_message_commits SELECT id,0,sender_id,?1,0,id,'fixture-hash',seq,0 FROM messages",
            [parse_counter(&agent.revision, "revision").unwrap()],
        ).unwrap();
        assert_eq!(
            db.commit_runtime_message(candidate(&agent, 120, "hour-limit", 0))
                .unwrap_err()
                .code,
            ErrorCode::Backpressure
        );
        db.conn
            .execute(
                "UPDATE messages SET created_at=?1",
                [now_ms() - HOUR_MS - 1],
            )
            .unwrap();
        db.commit_runtime_message(candidate(&agent, 120, "hour-limit", 0))
            .unwrap();
    }
}
