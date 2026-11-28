use super::*;
use crate::storage::{
    database::{open_reader, verify_database},
    search::search_database,
    worker::DbWorker,
};
use std::sync::{Arc, Mutex, mpsc};
use tempfile::TempDir;
use uuid::Uuid;

fn configured(database: &mut Database) -> AgentConfiguration {
    let global = database
        .get_global_configuration(&database.generation_id)
        .unwrap();
    let profile = ModelProfileInput {
        id: "runtime-test-model".into(),
        name: "Runtime fixture".into(),
        protocol: ModelProtocol::OpenaiChatCompletions,
        base_url: "https://runtime.example.invalid/v1".into(),
        model_name: "fixture".into(),
    };
    let global = database
        .save_global_configuration(GlobalConfigurationSaveRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: Uuid::now_v7().to_string(),
            expected_revision: global.revision,
            model_profiles: vec![profile],
            persona_presets: global.persona_presets,
        })
        .unwrap()
        .0;
    database
        .replace_credential_reference(
            &global.model_profiles[0].id,
            &global.model_profiles[0].revision,
            Some(Uuid::now_v7().to_string()),
        )
        .unwrap();
    let mut agent = database
        .list_agents(&database.generation_id)
        .unwrap()
        .remove(0);
    agent.model = Some(AgentModelSnapshot {
        source_profile_id: global.model_profiles[0].id.clone(),
        source_profile_revision: global.model_profiles[0].revision.clone(),
        profile: global.model_profiles[0].input(),
    });
    save_agent(database, agent)
}

fn fixture() -> (TempDir, Database, AgentConfiguration) {
    let directory = TempDir::new().unwrap();
    let mut database = Database::open(directory.path(), "runtime-test".into()).unwrap();
    let agent = configured(&mut database);
    (directory, database, agent)
}

fn save_agent(database: &mut Database, agent: AgentConfiguration) -> AgentConfiguration {
    let revision = agent.revision.clone();
    database
        .save_agent(AgentSaveRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: Uuid::now_v7().to_string(),
            expected_revision: Some(revision),
            configuration: agent,
        })
        .unwrap()
        .0
}

fn state(agent: &AgentConfiguration, status: AgentRuntimeStatus) -> AgentRuntimeState {
    AgentRuntimeState {
        agent_id: agent.agent_id.clone(),
        config_revision: agent.revision.clone(),
        status,
        detail: None,
        next_wake_at: None,
        requests_today: 0,
    }
}

fn candidate(
    agent: &AgentConfiguration,
    observed: i64,
    decision: &str,
    ordinal: u32,
    chain: &str,
) -> RuntimeMessage {
    RuntimeMessage {
        agent_id: agent.agent_id.clone(),
        config_revision: agent.revision.clone(),
        observed_through_seq: observed.into(),
        observed_content_epoch: 0.into(),
        observed_experience_revision: fingerprint(&[]),
        decision_id: decision.into(),
        ordinal,
        chain_id: chain.into(),
        parts: vec![MessagePart::Text {
            text: format!("自动分条 {ordinal}"),
        }],
        quote_message_id: None,
        mention_ids: Vec::new(),
        mention_all: false,
        cancellation: CancellationToken::new(),
    }
}

#[test]
fn manual_workspace_open_only_resolves_a_tool_in_the_current_generation() {
    let (_directory, mut database, mut agent) = fixture();
    let generation = database.generation_id.clone();
    assert!(database.ensure_tool_workspace(&generation, &agent.agent_id).is_err());
    agent.agent_type = AgentType::Tool;
    let agent = save_agent(&mut database, agent);
    let workspace = database.root.join("agents").join(&agent.agent_id).join("workspace");
    assert!(database.ensure_tool_workspace("old-generation", &agent.agent_id).is_err());
    assert!(!workspace.exists());
    assert_eq!(database.ensure_tool_workspace(&generation, &agent.agent_id).unwrap(), workspace);
    assert!(workspace.is_dir());
    std::fs::remove_dir(&workspace).unwrap();
    std::fs::write(&workspace, "不能用文件替代工作区").unwrap();
    assert!(database.ensure_tool_workspace(&generation, &agent.agent_id).is_err());
    assert_eq!(std::fs::read_to_string(workspace).unwrap(), "不能用文件替代工作区");
}

#[test]
fn tool_commit_requires_a_visible_direct_request_and_is_idempotent_per_target() {
    let (_directory, mut database, mut agent) = fixture();
    agent.agent_type = AgentType::Tool;
    let agent = save_agent(&mut database, agent);
    let generation = database.generation_id.clone();
    let ordinary = human(&mut database);
    let make_candidate = |request: &ChatSendResult, epoch: i64| {
        let decision_id = tool_decision_id(&agent.agent_id, &request.message_seq);
        let mut reply = candidate(&agent, request.message_seq.0.parse().unwrap(), &decision_id, 0, &request.message_id);
        reply.quote_message_id = Some(request.message_id.clone());
        reply.observed_content_epoch = epoch.into();
        reply
    };
    assert!(database.commit_runtime_message(make_candidate(&ordinary, 0)).is_err());
    let delegate = |database: &mut Database| database.send_message(ChatSendRequest {
        data_generation_id: generation.clone(), client_request_id: Uuid::now_v7().to_string(),
        parts: vec![MessagePart::Text { text: "请整理检查清单".into() }],
        quote_message_id: None, mention_ids: vec![agent.agent_id.clone()], mention_all: false,
    }).unwrap().0;
    let request = delegate(&mut database);
    human(&mut database);
    let reply = make_candidate(&request, 0);
    let (first, event) = database.commit_runtime_message(reply.clone()).unwrap();
    assert!(event.is_some());
    let (same, event) = database.commit_runtime_message(reply).unwrap();
    assert_eq!(first.message_id, same.message_id);
    assert!(event.is_none());

    let recalled = delegate(&mut database);
    database.recall_message(ChatRecallRequest {
        data_generation_id: generation, client_request_id: Uuid::now_v7().to_string(), message_id: recalled.message_id.clone(),
    }).unwrap();
    assert!(database.runtime_input_for(&agent.agent_id, Some(recalled.message_seq.clone())).is_err());
    assert!(database.commit_runtime_message(make_candidate(&recalled, 1)).is_err());
}

#[test]
fn tool_history_only_keeps_visible_exchange_with_the_requester() {
    let (_directory, mut database, mut agent) = fixture();
    agent.agent_type = AgentType::Tool;
    let agent = save_agent(&mut database, agent);
    let peer = database.list_agents(&database.generation_id).unwrap().into_iter()
        .find(|config| config.agent_id != agent.agent_id).unwrap();
    let generation = database.generation_id.clone();
    let send = |database: &mut Database, text: &str, mention_ids, quote_message_id| database.send_message(ChatSendRequest {
        data_generation_id: generation.clone(), client_request_id: Uuid::now_v7().to_string(),
        parts: vec![MessagePart::Text { text: text.into() }], quote_message_id, mention_ids, mention_all: false,
    }).unwrap().0;
    let direct = send(&mut database, "最早的任务", vec![agent.agent_id.clone()], None);
    let direct_seq = parse_counter(&direct.message_seq, "seq").unwrap();
    let mut reply = candidate(&agent, direct_seq, &tool_decision_id(&agent.agent_id, &direct.message_seq), 0, &direct.message_id);
    reply.quote_message_id = Some(direct.message_id.clone());
    let (answer, _) = database.commit_runtime_message(reply).unwrap();
    let aside = human(&mut database);
    database.conn.execute("UPDATE messages SET sender_id=?1 WHERE id=?2", params![peer.agent_id, aside.message_id]).unwrap();
    let stale = human(&mut database);
    let continuation = database.runtime_input_for(&agent.agent_id, Some(stale.message_seq.clone())).unwrap();
    assert_eq!(continuation.tool_turn().address, ToolAddress::FollowUp);
    assert!(continuation.is_local_tool_request());
    assert_eq!(continuation.messages.iter().map(|message| &message.id).collect::<Vec<_>>(),
        vec![&direct.message_id, &answer.message_id]);
    database.conn.execute("UPDATE messages SET created_at=(SELECT created_at FROM messages WHERE id=?1)+?2 WHERE id=?3",
        params![answer.message_id, TOOL_FOLLOW_UP_MS + 1, stale.message_id]).unwrap();
    let answer_seq = parse_counter(&answer.message_seq, "seq").unwrap();
    let stale_seq = parse_counter(&stale.message_seq, "seq").unwrap();
    assert!(database.next_tool_request(&agent.agent_id, answer_seq, stale_seq).unwrap().is_none());
    let others = send(&mut database, "给另外一个成员", vec![peer.agent_id.clone()], Some(answer.message_id.clone()));
    assert!(database.runtime_input_for(&agent.agent_id, Some(others.message_seq)).is_err());
    let from_peer = send(&mut database, "另一个人的独立委托", vec![agent.agent_id.clone()], None);
    database.conn.execute("UPDATE messages SET sender_id=?1 WHERE id=?2", params![peer.agent_id, from_peer.message_id]).unwrap();
    let quoted = send(&mut database, "请进一步解释", vec![], Some(answer.message_id.clone()));
    let input = database.runtime_input_for(&agent.agent_id, Some(quoted.message_seq.clone())).unwrap();
    assert_eq!(input.tool_turn().address, ToolAddress::Quote);
    assert_eq!(input.messages.iter().map(|message| &message.id).collect::<Vec<_>>(), vec![&direct.message_id, &answer.message_id]);
    assert!(!input.local_user_delegated_tool());
    database.recall_message(ChatRecallRequest {
        data_generation_id: generation, client_request_id: Uuid::now_v7().to_string(), message_id: direct.message_id,
    }).unwrap();
    let input = database.runtime_input_for(&agent.agent_id, Some(quoted.message_seq)).unwrap();
    assert!(input.messages.is_empty());
}

fn human(database: &mut Database) -> ChatSendResult {
    database
        .send_message(ChatSendRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: Uuid::now_v7().to_string(),
            parts: vec![MessagePart::Text {
                text: "真人的新消息".into(),
            }],
            quote_message_id: None,
            mention_ids: Vec::new(),
            mention_all: false,
        })
        .unwrap()
        .0
}

fn snapshot(database: &mut Database) -> AppSnapshot {
    database
        .snapshot(AppSnapshotRequest {
            data_generation_id: None,
            last_event_seq: None,
        })
        .unwrap()
}

fn code<T>(result: AppResult<T>, expected: ErrorCode) {
    match result {
        Err(error) => assert_eq!(error.code, expected, "{}", error.message),
        Ok(_) => panic!("unexpected success: {expected:?}"),
    }
}

fn rows(conn: &Connection, table: &str) -> i64 {
    conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| {
        row.get(0)
    })
    .unwrap()
}

#[test]
fn input_uses_member_snapshot_current_credential_and_sixty_four_visible_messages() {
    let (_directory, mut database, agent) = fixture();
    for _ in 0..69 {
        human(&mut database);
    }
    database
        .conn
        .execute("UPDATE messages SET state='recalled' WHERE seq=69", [])
        .unwrap();
    database
        .conn
        .execute("UPDATE messages SET state='deleted' WHERE seq=68", [])
        .unwrap();
    let input = database.runtime_input(&agent.agent_id).unwrap();
    assert_eq!(input.agent, agent);
    assert_eq!(input.messages.len(), 64);
    assert_eq!(input.messages.first().unwrap().seq.0, "4");
    assert_eq!(input.messages.last().unwrap().seq.0, "67");
    assert_eq!(input.snapshot.latest_message_seq.0, "69");
    let global = database
        .get_global_configuration(&database.generation_id)
        .unwrap();
    let old_ref = input.credential_ref;
    let new_ref = Uuid::now_v7().to_string();
    database
        .replace_credential_reference(
            &global.model_profiles[0].id,
            &global.model_profiles[0].revision,
            Some(new_ref.clone()),
        )
        .unwrap();
    assert_ne!(new_ref, old_ref);
    assert_eq!(
        database
            .runtime_input(&agent.agent_id)
            .unwrap()
            .credential_ref,
        new_ref
    );
    let mut changed = global.model_profiles[0].input();
    changed.model_name = "new-source-model-name".into();
    let current = database
        .get_global_configuration(&database.generation_id)
        .unwrap();
    database
        .save_global_configuration(GlobalConfigurationSaveRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: Uuid::now_v7().to_string(),
            expected_revision: current.revision,
            model_profiles: vec![changed.clone()],
            persona_presets: current.persona_presets.clone(),
        })
        .unwrap();
    assert_eq!(
        database
            .runtime_input(&agent.agent_id)
            .unwrap()
            .agent
            .model
            .unwrap()
            .profile
            .model_name,
        "fixture"
    );
    let current = database
        .get_global_configuration(&database.generation_id)
        .unwrap();
    changed.base_url = "https://different.example.invalid/v1".into();
    let current = database
        .save_global_configuration(GlobalConfigurationSaveRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: Uuid::now_v7().to_string(),
            expected_revision: current.revision,
            model_profiles: vec![changed],
            persona_presets: current.persona_presets,
        })
        .unwrap()
        .0;
    database
        .replace_credential_reference(
            &current.model_profiles[0].id,
            &current.model_profiles[0].revision,
            Some(Uuid::now_v7().to_string()),
        )
        .unwrap();
    code(
        database.runtime_input(&agent.agent_id),
        ErrorCode::InvalidInput,
    );
    assert_eq!(
        database.runtime_states().unwrap()[0].status,
        AgentRuntimeStatus::NeedsConfiguration
    );
}

#[test]
fn runtime_snapshot_status_and_events_are_truthful_and_unchanged_states_do_not_broadcast() {
    let (_directory, mut database, agent) = fixture();
    assert_eq!(
        database.runtime_states().unwrap()[0].status,
        AgentRuntimeStatus::Offline
    );
    for status in [
        AgentRuntimeStatus::Observing,
        AgentRuntimeStatus::Deciding,
        AgentRuntimeStatus::WaitingToSend,
        AgentRuntimeStatus::Sleeping,
    ] {
        let requested = state(&agent, status.clone());
        let event = database
            .set_runtime_state(requested.clone())
            .unwrap()
            .unwrap();
        let participant = snapshot(&mut database)
            .participants
            .into_iter()
            .find(|p| p.id == agent.agent_id)
            .unwrap();
        assert_eq!(participant.status, ParticipantStatus::Present);
        assert_eq!(participant.runtime.as_ref().unwrap().status, status);
        match event.payload {
            EventPayload::ParticipantProfileChanged {
                participant: changed,
            } => assert_eq!(changed.runtime.unwrap().status, status),
            _ => panic!("wrong event"),
        }
        assert!(database.set_runtime_state(requested).unwrap().is_none());
    }
    for status in [
        AgentRuntimeStatus::Offline,
        AgentRuntimeStatus::Protected,
        AgentRuntimeStatus::NeedsConfiguration,
    ] {
        database.set_runtime_state(state(&agent, status)).unwrap();
        assert_eq!(
            snapshot(&mut database)
                .participants
                .into_iter()
                .find(|p| p.id == agent.agent_id)
                .unwrap()
                .status,
            ParticipantStatus::NeedsConfiguration
        );
    }
    assert!(snapshot(&mut database).local_user.runtime.is_none());
    database.set_runtime_paused(&agent.agent_id, true).unwrap();
    assert_eq!(
        snapshot(&mut database)
            .participants
            .into_iter()
            .find(|p| p.id == agent.agent_id)
            .unwrap()
            .runtime
            .unwrap()
            .status,
        AgentRuntimeStatus::Paused
    );
}

#[test]
fn request_quota_counts_silence_failures_and_survives_restart_and_utc_day_change() {
    let (directory, mut database, agent) = fixture();
    let agent = save_agent(&mut database, agent);
    assert_eq!(
        database
            .reserve_runtime_request(&agent.agent_id, 3)
            .unwrap(),
        1
    );
    // There is no message and no success acknowledgement: the reservation is
    // charged regardless of model failure or silence.
    assert_eq!(rows(&database.conn, "messages"), 0);
    drop(database);
    let mut restarted = Database::open(directory.path(), "request-restart".into()).unwrap();
    assert_eq!(restarted.runtime_states().unwrap()[0].requests_today, 1);
    assert_eq!(
        restarted
            .reserve_runtime_request(&agent.agent_id, 3)
            .unwrap(),
        2
    );
    assert_eq!(
        restarted
            .reserve_runtime_request(&agent.agent_id, 3)
            .unwrap(),
        3
    );
    code(
        restarted.reserve_runtime_request(&agent.agent_id, 3),
        ErrorCode::Backpressure,
    );
    let tomorrow = (now_ms().div_euclid(UTC_DAY_MS) + 1) * UTC_DAY_MS;
    assert_eq!(
        restarted
            .reserve_runtime_request_at(&agent.agent_id, 3, tomorrow)
            .unwrap(),
        1
    );
    assert_eq!(rows(&restarted.conn, "runtime_request_counts"), 2);
}

#[test]
fn each_agent_has_five_hundred_requests_and_quota_survives_restart() {
    let (directory, mut database, agent) = fixture();
    let mut second = agent.clone();
    second.agent_id = "second-quota-agent".into();
    let second = database
        .save_agent(AgentSaveRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: Uuid::now_v7().to_string(),
            expected_revision: None,
            configuration: second,
        })
        .unwrap()
        .0;
    // 额度按智能体计：第一个成员用满 500 后拒绝，第二个成员仍有自己的 500。
    for _ in 0..500 {
        database
            .reserve_runtime_request(&agent.agent_id, 500)
            .unwrap();
    }
    code(
        database.reserve_runtime_request(&agent.agent_id, 500),
        ErrorCode::Backpressure,
    );
    assert_eq!(
        database
            .reserve_runtime_request(&second.agent_id, 500)
            .unwrap(),
        1
    );
    drop(database);
    let mut restarted = Database::open(directory.path(), "quota-cap-restart".into()).unwrap();
    code(
        restarted.reserve_runtime_request(&agent.agent_id, 500),
        ErrorCode::Backpressure,
    );
    assert_eq!(
        restarted
            .reserve_runtime_request(&second.agent_id, 500)
            .unwrap(),
        2
    );
    assert_eq!(rows(&restarted.conn, "messages"), 0);
}

#[test]
fn connection_test_quota_is_separate_durable_and_does_not_reduce_agent_quota() {
    let (directory, mut database, agent) = fixture();
    let owner = "test:runtime-test-model";
    for count in 1..=20 {
        assert_eq!(database.reserve_runtime_request(owner, 500).unwrap(), count);
    }
    code(
        database.reserve_runtime_request(owner, 500),
        ErrorCode::Backpressure,
    );
    assert_eq!(database.runtime_states().unwrap()[0].requests_today, 0);
    code(
        database.reserve_runtime_request("test:missing-profile", 20),
        ErrorCode::InvalidInput,
    );
    drop(database);
    let mut database = Database::open(directory.path(), "connection-test-restart".into()).unwrap();
    code(
        database.reserve_runtime_request(owner, 20),
        ErrorCode::Backpressure,
    );
    for _ in 0..500 {
        database
            .reserve_runtime_request(&agent.agent_id, 500)
            .unwrap();
    }
    code(
        database.reserve_runtime_request(&agent.agent_id, 500),
        ErrorCode::Backpressure,
    );
    // 调用记在同一张表里，但测试与每个成员独立限额。
    let total: u32 = database
        .conn
        .query_row(
            "SELECT COALESCE(SUM(requests),0) FROM runtime_request_counts WHERE utc_day=?1",
            [now_ms().div_euclid(UTC_DAY_MS)],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(total, 520);
    let tomorrow = (now_ms().div_euclid(UTC_DAY_MS) + 1) * UTC_DAY_MS;
    assert_eq!(
        database
            .reserve_runtime_request_at(owner, 20, tomorrow)
            .unwrap(),
        1
    );
}

#[test]
fn deleted_agent_history_and_connection_tests_cannot_use_another_agents_daily_quota() {
    let (directory, mut database, agent) = fixture();
    let deleted = database
        .list_agents(&database.generation_id)
        .unwrap()
        .into_iter()
        .find(|other| other.agent_id != agent.agent_id)
        .unwrap();
    for count in 1..=500 {
        assert_eq!(database.reserve_runtime_request(&deleted.agent_id, 500).unwrap(), count);
    }
    let transaction = database.conn.transaction().unwrap();
    for table in ["agent_runtime_states", "agent_config_versions", "agent_configurations"] {
        transaction.execute(&format!("DELETE FROM {table} WHERE agent_id=?1"), [&deleted.agent_id]).unwrap();
    }
    transaction.execute("DELETE FROM participants WHERE id=?1", [&deleted.agent_id]).unwrap();
    transaction.commit().unwrap();
    for count in 1..=500 {
        assert_eq!(database.reserve_runtime_request(&agent.agent_id, 500).unwrap(), count);
    }
    let owner = "test:runtime-test-model";
    for count in 1..=20 {
        assert_eq!(database.reserve_runtime_request(owner, 500).unwrap(), count);
    }
    drop(database);
    let mut restarted = Database::open(directory.path(), "deleted-quota-restart".into()).unwrap();
    assert_eq!(restarted.list_agents(&restarted.generation_id).unwrap().len(), 1);
    assert_eq!(count_today(&restarted.conn, &deleted.agent_id, now_ms()).unwrap(), 500);
    code(restarted.reserve_runtime_request(&agent.agent_id, 500), ErrorCode::Backpressure);
    code(restarted.reserve_runtime_request(owner, 20), ErrorCode::Backpressure);
}

#[test]
fn sender_identity_mentions_indexes_and_chain_commit_in_one_transaction() {
    let (_directory, mut database, mut agent) = fixture();
    database.conn.execute("INSERT INTO avatar_objects VALUES ('runtime-avatar','avatars/runtime.png','image/png',1,1,1,'test-hash')", []).unwrap();
    agent.display_name = "真实成员昵称".into();
    agent.avatar_id = Some("runtime-avatar".into());
    let agent = save_agent(&mut database, agent);
    let root = human(&mut database);
    assert_eq!(
        database.runtime_chain(root.message_seq.clone()).unwrap(),
        root.message_id
    );
    let mut message = candidate(&agent, 1, "real-agent-decision", 0, &root.message_id);
    message.parts = vec![MessagePart::Text {
        text: "可搜索的自动成员正文".into(),
    }];
    message.quote_message_id = Some(root.message_id.clone());
    message.mention_ids = vec![
        database.local_user_id.clone(),
        database.local_user_id.clone(),
    ];
    let (committed, event) = database.commit_runtime_message(message).unwrap();
    assert!(
        matches!(event.unwrap().payload, EventPayload::MessageCommitted { sender_id, .. } if sender_id==agent.agent_id)
    );
    let page = database
        .list_messages(ChatListRequest {
            data_generation_id: database.generation_id.clone(),
            before_seq: None,
            after_seq: None,
            around_seq: None,
            limit: 30,
        })
        .unwrap();
    let stored = page.items.last().unwrap();
    assert_eq!(stored.sender_id, agent.agent_id);
    let participant = crate::storage::chat::participants(&database.conn)
        .unwrap()
        .into_iter()
        .find(|participant| participant.id == stored.sender_id)
        .unwrap();
    assert_eq!(participant.kind, ParticipantKind::Agent);
    assert_eq!(participant.display_name, agent.display_name);
    assert_eq!(participant.avatar_id, agent.avatar_id);
    assert_eq!(stored.mention_ids, vec![database.local_user_id.clone()]);
    assert_eq!(
        database
            .runtime_chain(committed.message_seq.clone())
            .unwrap(),
        root.message_id
    );
    assert_eq!(
        database
            .conn
            .query_row(
                "SELECT COUNT(*) FROM avatar_refs WHERE ref_kind='message' AND owner_id=?1",
                [&committed.message_id],
                |row| row.get::<_, i64>(0)
            )
            .unwrap(),
        0
    );
    let search = search_database(
        &database.conn,
        &ChatSearchRequest {
            data_generation_id: database.generation_id.clone(),
            search_id: "runtime-search".into(),
            query: "自动成员正文".into(),
            sender_id: None,
            created_after: None,
            created_before: None,
            cursor: None,
            limit: 30,
        },
    )
    .unwrap();
    assert_eq!(search.items[0].message_id, committed.message_id);
    assert_eq!(search.items[0].sender_id, agent.agent_id);
    let mut renamed = agent;
    renamed.display_name = "之后改名".into();
    let renamed = save_agent(&mut database, renamed);
    let participant = crate::storage::chat::participants(&database.conn)
        .unwrap()
        .into_iter()
        .find(|participant| participant.id == stored.sender_id)
        .unwrap();
    assert_eq!(participant.display_name, renamed.display_name);
    verify_database(&database.conn).unwrap();
}

#[test]
fn user_ipc_cannot_select_sender_or_decision_or_chain_and_agents_cannot_mention_all() {
    let (_directory, mut database, agent) = fixture();
    let original = serde_json::json!({ "data_generation_id": database.generation_id, "client_request_id": "forged-human", "parts": [{"kind":"text","text":"x"}], "mention_ids": [], "mention_all":false });
    for key in ["sender_id", "agent_id", "decision_id", "chain_id"] {
        let mut forged = original.clone();
        forged[key] = serde_json::json!(agent.agent_id);
        assert!(serde_json::from_value::<ChatSendRequest>(forged).is_err());
    }
    let mut all = candidate(&agent, 0, "all-members", 0, "root");
    all.mention_all = true;
    code(
        database.commit_runtime_message(all),
        ErrorCode::PermissionDenied,
    );
    assert_eq!(rows(&database.conn, "messages"), 0);
    assert_eq!(rows(&database.conn, "runtime_messages"), 0);
}

#[test]
fn split_parts_do_not_invalidate_each_other_but_any_external_message_does() {
    let (_directory, mut database, agent) = fixture();
    let first = candidate(&agent, 0, "split-decision", 0, "split-chain");
    let (first_result, _) = database.commit_runtime_message(first.clone()).unwrap();
    let second = candidate(&agent, 0, "split-decision", 1, "split-chain");
    database.commit_runtime_message(second.clone()).unwrap();
    human(&mut database);
    code(
        database.commit_runtime_message(candidate(&agent, 0, "split-decision", 2, "split-chain")),
        ErrorCode::ConfigConflict,
    );
    // Accepted idempotent parts still replay even though the observation is
    // stale now; replay never creates another message or event.
    let (replay, event) = database.commit_runtime_message(first).unwrap();
    assert_eq!(replay.message_id, first_result.message_id);
    assert!(event.is_none());
    let mut changed = second;
    changed.parts = vec![MessagePart::Text {
        text: "changed".into(),
    }];
    code(
        database.commit_runtime_message(changed),
        ErrorCode::IdempotencyConflict,
    );
    assert_eq!(rows(&database.conn, "messages"), 3);
    assert_eq!(rows(&database.conn, "runtime_messages"), 2);
}

#[test]
fn another_agent_or_another_decision_by_same_agent_invalidates_old_candidates() {
    let (_directory, mut database, agent) = fixture();
    database
        .commit_runtime_message(candidate(&agent, 0, "other-decision", 0, "root"))
        .unwrap();
    code(
        database.commit_runtime_message(candidate(&agent, 0, "old-decision", 0, "root")),
        ErrorCode::ConfigConflict,
    );
    let mut second = agent.clone();
    second.agent_id = "other-sender-agent".into();
    let second = database
        .save_agent(AgentSaveRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: Uuid::now_v7().to_string(),
            expected_revision: None,
            configuration: second,
        })
        .unwrap()
        .0;
    database
        .commit_runtime_message(candidate(&second, 1, "second-agent", 0, "root"))
        .unwrap();
    code(
        database.commit_runtime_message(candidate(&agent, 1, "stale-after-agent", 0, "root")),
        ErrorCode::ConfigConflict,
    );
}

#[test]
fn decision_identity_is_consistent_and_idempotency_survives_restart() {
    let (directory, mut database, agent) = fixture();
    let original = candidate(&agent, 0, "restart-decision", 0, "root");
    let result = database.commit_runtime_message(original.clone()).unwrap().0;
    let mut changed = candidate(&agent, 1, "restart-decision", 1, "root");
    code(
        database.commit_runtime_message(changed.clone()),
        ErrorCode::IdempotencyConflict,
    );
    changed.observed_through_seq = 0.into();
    changed.chain_id = "other-root".into();
    code(
        database.commit_runtime_message(changed),
        ErrorCode::IdempotencyConflict,
    );
    drop(database);
    let mut restarted = Database::open(directory.path(), "idempotent-restart".into()).unwrap();
    let (replay, event) = restarted.commit_runtime_message(original).unwrap();
    assert_eq!(replay.message_id, result.message_id);
    assert_eq!(replay.data_generation_id, "idempotent-restart");
    assert!(event.is_none());
    assert_eq!(rows(&restarted.conn, "runtime_messages"), 1);
}

#[test]
fn quote_must_be_visible_and_already_observed_including_split_parts() {
    let (_directory, mut database, agent) = fixture();
    let root = human(&mut database);
    let mut quoted = candidate(&agent, 1, "quote", 0, &root.message_id);
    quoted.quote_message_id = Some(root.message_id.clone());
    database
        .conn
        .execute(
            "UPDATE messages SET state='recalled' WHERE id=?1",
            [&root.message_id],
        )
        .unwrap();
    code(
        database.commit_runtime_message(quoted.clone()),
        ErrorCode::MessageNotFound,
    );
    database
        .conn
        .execute(
            "UPDATE messages SET state='visible' WHERE id=?1",
            [&root.message_id],
        )
        .unwrap();
    let part = database.commit_runtime_message(quoted).unwrap().0;
    let mut self_quote = candidate(&agent, 1, "quote", 1, &root.message_id);
    self_quote.quote_message_id = Some(part.message_id);
    code(
        database.commit_runtime_message(self_quote),
        ErrorCode::MessageNotFound,
    );
    code(
        database.commit_runtime_message(candidate(&agent, 999, "future", 0, "root")),
        ErrorCode::InvalidInput,
    );
}

#[test]
fn pause_and_revision_fences_clear_old_plans_and_old_states_cannot_resume() {
    let (directory, mut database, agent) = fixture();
    let next = now_ms() + HOUR_MS;
    database
        .save_runtime_plan(
            &agent.agent_id,
            agent.revision.clone(),
            Some(next),
            "root".into(),
        )
        .unwrap();
    assert_eq!(
        database.runtime_plan(&agent.agent_id).unwrap().unwrap().0,
        next
    );
    let stale = candidate(&agent, 0, "stale", 0, "root");
    let (paused, event) = database.set_runtime_paused(&agent.agent_id, true).unwrap();
    assert!(event.is_some());
    assert_eq!(paused.status, AgentRuntimeStatus::Paused);
    assert!(
        database
            .set_runtime_paused(&agent.agent_id, true)
            .unwrap()
            .1
            .is_none()
    );
    assert!(database.runtime_plan(&agent.agent_id).unwrap().is_none());
    assert!(
        database
            .set_runtime_state(state(&agent, AgentRuntimeStatus::Observing))
            .unwrap()
            .is_none()
    );
    code(
        database.commit_runtime_message(stale.clone()),
        ErrorCode::PermissionDenied,
    );
    let mut edited = agent.clone();
    edited.language_style = "new style".into();
    let edited = save_agent(&mut database, edited);
    assert!(database.runtime_is_paused(&agent.agent_id).unwrap());
    assert_eq!(
        database.runtime_states().unwrap()[0].config_revision,
        edited.revision
    );
    assert!(
        database
            .set_runtime_state(state(&agent, AgentRuntimeStatus::Observing))
            .unwrap()
            .is_none()
    );
    database
        .save_runtime_plan(
            &agent.agent_id,
            agent.revision.clone(),
            Some(next),
            "old-chain".into(),
        )
        .unwrap();
    assert!(database.runtime_plan(&agent.agent_id).unwrap().is_none());
    drop(database);
    let mut restarted = Database::open(directory.path(), "pause-restart".into()).unwrap();
    assert!(restarted.runtime_is_paused(&agent.agent_id).unwrap());
    let (resumed, _) = restarted
        .set_runtime_paused(&agent.agent_id, false)
        .unwrap();
    assert_eq!(resumed.status, AgentRuntimeStatus::Observing);
    assert_eq!(resumed.next_wake_at, None);
    code(
        restarted.commit_runtime_message(stale),
        ErrorCode::ConfigConflict,
    );
    assert!(
        restarted
            .set_runtime_state(state(&agent, AgentRuntimeStatus::Deciding))
            .unwrap()
            .is_none()
    );
    restarted
        .commit_runtime_message(candidate(&edited, 0, "new-revision", 0, "root"))
        .unwrap();
}

#[test]
fn plans_survive_restart_but_configuration_changes_cancel_them() {
    let (directory, mut database, agent) = fixture();
    let next = now_ms() + HOUR_MS;
    database
        .save_runtime_plan(
            &agent.agent_id,
            agent.revision.clone(),
            Some(next),
            "plan-chain".into(),
        )
        .unwrap();
    drop(database);
    let mut restarted = Database::open(directory.path(), "plan-restart".into()).unwrap();
    assert_eq!(
        restarted.runtime_plan(&agent.agent_id).unwrap(),
        Some((next, "plan-chain".into(), agent.revision.clone()))
    );
    assert_eq!(
        restarted.runtime_states().unwrap()[0].next_wake_at,
        Some(next)
    );
    save_agent(&mut restarted, agent.clone());
    assert!(restarted.runtime_plan(&agent.agent_id).unwrap().is_none());
    assert_eq!(restarted.runtime_states().unwrap()[0].next_wake_at, None);
}

#[test]
fn wake_log_has_two_reservations_per_rolling_hour_across_restart_and_boundary() {
    let (directory, mut database, agent) = fixture();
    let now = now_ms();
    assert_eq!(
        database
            .reserve_runtime_wake_at(&agent.agent_id, now)
            .unwrap(),
        None
    );
    assert_eq!(
        database
            .reserve_runtime_wake_at(&agent.agent_id, now + MINUTE_MS)
            .unwrap(),
        None
    );
    assert_eq!(
        database
            .reserve_runtime_wake_at(&agent.agent_id, now + 2 * MINUTE_MS)
            .unwrap(),
        Some(now + HOUR_MS)
    );
    drop(database);
    let mut restarted = Database::open(directory.path(), "wake-restart".into()).unwrap();
    assert_eq!(
        restarted
            .reserve_runtime_wake_at(&agent.agent_id, now + HOUR_MS - 1)
            .unwrap(),
        Some(now + HOUR_MS)
    );
    assert_eq!(
        restarted
            .reserve_runtime_wake_at(&agent.agent_id, now + HOUR_MS)
            .unwrap(),
        None
    );
    assert_eq!(
        restarted
            .reserve_runtime_wake_at(&agent.agent_id, now + HOUR_MS)
            .unwrap(),
        Some(now + HOUR_MS + MINUTE_MS)
    );
    assert_eq!(
        restarted
            .reserve_runtime_wake_at(&agent.agent_id, now + HOUR_MS + MINUTE_MS)
            .unwrap(),
        None
    );
    assert_eq!(rows(&restarted.conn, "runtime_wake_log"), 2);
}

#[test]
fn minute_limit_is_global_durable_and_counts_every_split_part() {
    let (directory, mut database, agent) = fixture();
    let now = now_ms();
    // 分钟总量上限（40）：4 个决策 × 10 条分条，各自独立话题链，避开链限制。
    for decision in 0..4 {
        let observed = allocated_seq(&database.conn, "messages").unwrap();
        for ordinal in 0..10 {
            database
                .commit_runtime_message_at(
                    candidate(&agent, observed, &format!("minute-{decision}"), ordinal, &format!("minute-chain-{decision}")),
                    now,
                )
                .unwrap();
        }
    }
    let error = database
        .commit_runtime_message_at(
            candidate(&agent, 30, "minute-3", 10, "minute-chain-3"),
            now,
        )
        .unwrap_err();
    assert_eq!(error.code, ErrorCode::Backpressure);
    assert!(error.message.contains("一分钟"));
    let observed = allocated_seq(&database.conn, "messages").unwrap();
    code(
        database.commit_runtime_message_at(
            candidate(&agent, observed, "minute-extra", 0, "minute-chain-extra"),
            now + MINUTE_MS - 1,
        ),
        ErrorCode::Backpressure,
    );
    drop(database);
    let mut restarted = Database::open(directory.path(), "minute-restart".into()).unwrap();
    code(
        restarted.commit_runtime_message_at(
            candidate(&agent, observed, "minute-extra", 0, "minute-chain-extra"),
            now,
        ),
        ErrorCode::Backpressure,
    );
    assert_eq!(rows(&restarted.conn, "runtime_messages"), 40);
}

#[test]
fn chain_limit_counts_reply_rounds_and_allows_the_final_round_to_finish() {
    let (directory, mut database, agent) = fixture();
    let now = now_ms();
    let mut final_observed = 0;
    for decision in 0..20 {
        let observed = allocated_seq(&database.conn, "messages").unwrap();
        final_observed = observed;
        for ordinal in 0..2 {
            database
                .commit_runtime_message_at(
                    candidate(&agent, observed, &format!("chain-{decision}"), ordinal, "limited-chain"),
                    now + decision * MINUTE_MS,
                )
                .unwrap();
        }
    }
    let observed = allocated_seq(&database.conn, "messages").unwrap();
    let error = database
        .commit_runtime_message_at(
            candidate(&agent, observed, "chain-extra", 0, "limited-chain"),
            now + 20 * MINUTE_MS,
        )
        .unwrap_err();
    assert_eq!(error.code, ErrorCode::Backpressure);
    assert!(error.message.contains("20 回合"));
    assert_eq!(rows(&database.conn, "runtime_messages"), 40);
    drop(database);
    let mut restarted = Database::open(directory.path(), "chain-restart".into()).unwrap();
    restarted
        .commit_runtime_message_at(
            candidate(&agent, final_observed, "chain-19", 2, "limited-chain"),
            now + 20 * MINUTE_MS,
        )
        .unwrap();
    let observed = allocated_seq(&restarted.conn, "messages").unwrap();
    code(
        restarted.commit_runtime_message_at(
            candidate(&agent, observed, "chain-extra", 0, "limited-chain"),
            now + 20 * MINUTE_MS,
        ),
        ErrorCode::Backpressure,
    );
    restarted
        .commit_runtime_message_at(
            candidate(&agent, observed, "chain-extra", 0, "limited-chain"),
            now + CHAIN_WINDOW_MS,
        )
        .unwrap();
    assert_eq!(rows(&restarted.conn, "runtime_messages"), 42);
}

#[test]
fn global_hour_limit_persists_across_restart_and_chain_changes() {
    let (directory, mut database, agent) = fixture();
    let now = now_ms();
    // 40 分钟 × 每分钟 10 条 = 400 条小时额度，且每分钟/每链都不触发保护。
    let start = now - 40 * MINUTE_MS;
    for minute in 0..40 {
        let observed = allocated_seq(&database.conn, "messages").unwrap();
        for ordinal in 0..10 {
            database
                .commit_runtime_message_at(
                    candidate(
                        &agent,
                        observed,
                        &format!("hour-{minute}"),
                        ordinal,
                        &format!("chain-{minute}"),
                    ),
                    start + minute * MINUTE_MS,
                )
                .unwrap();
        }
    }
    let error = database
        .commit_runtime_message_at(
            candidate(&agent, 390, "hour-39", 10, "chain-39"),
            now,
        )
        .unwrap_err();
    assert_eq!(error.code, ErrorCode::Backpressure);
    assert!(error.message.contains("一小时"));
    let observed = allocated_seq(&database.conn, "messages").unwrap();
    drop(database);
    let mut restarted = Database::open(directory.path(), "hour-restart".into()).unwrap();
    code(
        restarted.commit_runtime_message_at(
            candidate(&agent, observed, "hour-cap", 0, "fresh-chain"),
            now,
        ),
        ErrorCode::Backpressure,
    );
    assert_eq!(rows(&restarted.conn, "runtime_messages"), 400);
    restarted
        .commit_runtime_message_at(
            candidate(&agent, observed, "hour-boundary", 0, "fresh-chain"),
            start + HOUR_MS,
        )
        .unwrap();
}

#[test]
fn failed_event_rolls_back_runtime_message_indexes_log_and_avatar_reference() {
    let (_directory, mut database, agent) = fixture();
    let events = rows(&database.conn, "domain_events");
    database.conn.execute_batch("CREATE TEMP TRIGGER reject_runtime_event BEFORE INSERT ON main.domain_events BEGIN SELECT RAISE(ABORT,'fixture'); END;").unwrap();
    assert!(
        database
            .commit_runtime_message(candidate(&agent, 0, "failed-event", 0, "root"))
            .is_err()
    );
    for table in [
        "messages",
        "message_parts",
        "mentions",
        "search_text",
        "runtime_messages",
        "runtime_message_activity",
    ] {
        assert_eq!(rows(&database.conn, table), 0, "{table}");
    }
    assert_eq!(rows(&database.conn, "domain_events"), events);
    database
        .conn
        .execute_batch("DROP TRIGGER temp.reject_runtime_event")
        .unwrap();
    database
        .commit_runtime_message(candidate(&agent, 0, "failed-event", 0, "root"))
        .unwrap();
    database
        .conn
        .execute(
            "INSERT INTO message_search(message_search, rank) VALUES ('integrity-check',1)",
            [],
        )
        .unwrap();
}

#[test]
fn worker_runtime_writes_broadcast_after_commit_not_replay_or_cancelled_queued_work() {
    let directory = TempDir::new().unwrap();
    let callbacks = Arc::new(Mutex::new(Vec::new()));
    let received = callbacks.clone();
    let path = directory.path().join("chat.sqlite3");
    let worker = DbWorker::open(
        directory.path(),
        "worker-runtime".into(),
        Arc::new(move |event| {
            let reader = open_reader(&path).unwrap();
            assert!(
                reader
                    .query_row(
                        "SELECT EXISTS(SELECT 1 FROM domain_events WHERE id=?1)",
                        [&event.event_id],
                        |row| row.get::<_, bool>(0)
                    )
                    .unwrap()
            );
            received.lock().unwrap().push(event.clone());
        }),
    )
    .unwrap();
    let agent = tauri::async_runtime::block_on(worker.call(|db| Ok(configured(db)))).unwrap();
    callbacks.lock().unwrap().clear();
    let requested = state(&agent, AgentRuntimeStatus::Observing);
    tauri::async_runtime::block_on(worker.set_runtime_state(requested.clone())).unwrap();
    tauri::async_runtime::block_on(worker.set_runtime_state(requested)).unwrap();
    assert_eq!(callbacks.lock().unwrap().len(), 1);
    let original = candidate(&agent, 0, "worker-decision", 0, "root");
    tauri::async_runtime::block_on(worker.commit_runtime_message(original.clone())).unwrap();
    tauri::async_runtime::block_on(worker.commit_runtime_message(original)).unwrap();
    assert_eq!(callbacks.lock().unwrap().len(), 2);
    let (started, running) = mpsc::channel();
    let (release, blocked) = mpsc::channel();
    let blocker_worker = worker.clone();
    let blocker = tauri::async_runtime::spawn(async move {
        blocker_worker
            .call(move |_| {
                started.send(()).unwrap();
                blocked.recv().unwrap();
                Ok(())
            })
            .await
    });
    running
        .recv_timeout(std::time::Duration::from_secs(2))
        .unwrap();
    let cancelled = candidate(&agent, 1, "cancelled-queued", 0, "root");
    let token = cancelled.cancellation.clone();
    let queued = worker.commit_runtime_message(cancelled);
    let mut queued = Box::pin(queued);
    use std::future::Future;
    assert!(matches!(
        queued
            .as_mut()
            .poll(&mut std::task::Context::from_waker(std::task::Waker::noop())),
        std::task::Poll::Pending
    ));
    token.cancel();
    release.send(()).unwrap();
    tauri::async_runtime::block_on(blocker).unwrap().unwrap();
    code(
        tauri::async_runtime::block_on(queued),
        ErrorCode::ShuttingDown,
    );
    assert_eq!(callbacks.lock().unwrap().len(), 2);
    tauri::async_runtime::block_on(worker.call(|db| {
        assert_eq!(rows(&db.conn, "messages"), 1);
        assert_eq!(rows(&db.conn, "runtime_messages"), 1);
        Ok(())
    }))
    .unwrap();
    tauri::async_runtime::block_on(worker.shutdown()).unwrap();
}

fn remove_chat_message(database: &mut Database, message: &ChatSendResult) {
    let seq = parse_counter(&message.message_seq, "message_seq").unwrap();
    let transaction = database.conn.transaction().unwrap();
    transaction.execute("INSERT INTO message_search(message_search,rowid,text) SELECT 'delete',seq,text FROM search_text WHERE seq=?1", [seq]).unwrap();
    transaction
        .execute("DELETE FROM messages WHERE seq=?1", [seq])
        .unwrap();
    transaction.commit().unwrap();
}

#[test]
fn deleting_external_messages_does_not_remove_observation_fences_or_root_identity() {
    let (directory, mut database, agent) = fixture();
    let external = human(&mut database);
    remove_chat_message(&mut database, &external);
    assert_eq!(rows(&database.conn, "messages"), 0);
    assert_eq!(
        database
            .runtime_chain(external.message_seq.clone())
            .unwrap(),
        external.message_id
    );
    drop(database);
    let mut restarted =
        Database::open(directory.path(), "deleted-external-restart".into()).unwrap();
    code(
        restarted.commit_runtime_message(candidate(&agent, 0, "old-deleted-candidate", 0, "root")),
        ErrorCode::ConfigConflict,
    );
    restarted
        .commit_runtime_message(candidate(&agent, 1, "fresh-deleted-candidate", 0, "root"))
        .unwrap();
}

#[test]
fn deleting_automatic_messages_does_not_reset_limits_idempotency_or_own_part_exemption() {
    let (_directory, mut database, agent) = fixture();
    let now = now_ms();
    let original = candidate(&agent, 0, "delete-split", 0, "delete-chain");
    let first = database
        .commit_runtime_message_at(original.clone(), now)
        .unwrap()
        .0;
    remove_chat_message(&mut database, &first);
    assert_eq!(
        database.runtime_chain(first.message_seq.clone()).unwrap(),
        "delete-chain"
    );
    let (replay, event) = database.commit_runtime_message(original).unwrap();
    assert_eq!(replay.message_id, first.message_id);
    assert!(event.is_none());
    // 删除聊天消息不重置分钟限流：再用 3 个决策 × 13 条凑满 40 条分钟额度。
    for decision in 1..4 {
        let observed = allocated_seq(&database.conn, "messages").unwrap();
        for ordinal in 0..13 {
            let result = database
                .commit_runtime_message_at(
                    candidate(&agent, observed, &format!("delete-split-{decision}"), ordinal, &format!("delete-chain-{decision}")),
                    now,
                )
                .unwrap()
                .0;
            remove_chat_message(&mut database, &result);
        }
    }
    let observed = allocated_seq(&database.conn, "messages").unwrap();
    assert_eq!(rows(&database.conn, "messages"), 0);
    assert_eq!(rows(&database.conn, "runtime_messages"), 40);
    code(
        database.commit_runtime_message_at(
            candidate(&agent, observed, "delete-extra", 0, "delete-chain-extra"),
            now,
        ),
        ErrorCode::Backpressure,
    );
    database
        .commit_runtime_message_at(
            candidate(&agent, observed, "delete-later", 0, "delete-chain"),
            now + MINUTE_MS,
        )
        .unwrap();
}

#[test]
fn recalled_observation_invalidates_stale_runtime_parts_without_advancing_message_sequence() {
    let (_directory, mut database, agent) = fixture();
    let external = human(&mut database);
    let observed = parse_counter(&external.message_seq, "observed").unwrap();
    let first = candidate(&agent, observed, "before-recall", 0, "recall-chain");
    let committed = database.commit_runtime_message(first.clone()).unwrap().0;
    database
        .recall_message(ChatRecallRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: Uuid::now_v7().to_string(),
            message_id: external.message_id,
        })
        .unwrap();
    code(
        database.commit_runtime_message(candidate(
            &agent,
            observed,
            "before-recall",
            1,
            "recall-chain",
        )),
        ErrorCode::ConfigConflict,
    );
    let (replay, event) = database.commit_runtime_message(first).unwrap();
    assert_eq!(replay.message_id, committed.message_id);
    assert!(event.is_none());
    let input = database.runtime_input(&agent.agent_id).unwrap();
    assert_eq!(input.snapshot.room.content_epoch, 1.into());
    assert_eq!(input.snapshot.latest_message_seq, committed.message_seq);
    assert!(
        !input
            .messages
            .iter()
            .any(|m| m.state != MessageState::Visible)
    );
    let mut fresh = candidate(
        &agent,
        parse_counter(&committed.message_seq, "latest").unwrap(),
        "after-recall",
        0,
        "fresh-chain",
    );
    fresh.observed_content_epoch = 1.into();
    database.commit_runtime_message(fresh).unwrap();
}

#[test]
fn quoted_questions_remain_addressed_outside_the_recent_context_window() {
    let (_directory, mut database, agent) = fixture();
    let own = database.commit_runtime_message(candidate(&agent, 0, "quote-own", 0, "quote-chain")).unwrap().0;
    let question = database.send_message(ChatSendRequest {
        data_generation_id: database.generation_id.clone(),
        client_request_id: Uuid::now_v7().to_string(),
        parts: vec![MessagePart::Text { text: "你说的是哪件事？".into() }],
        quote_message_id: Some(own.message_id.clone()), mention_ids: vec![], mention_all: false,
    }).unwrap().0;
    for _ in 0..65 { human(&mut database); }
    assert!(!database.runtime_input(&agent.agent_id).unwrap().messages.iter().any(|message| message.id == question.message_id));
    assert_eq!(database.runtime_mention_seq(&agent.agent_id, own.message_seq).unwrap(), question.message_seq);
    database.conn.execute("UPDATE messages SET state='recalled' WHERE id=?1", [&own.message_id]).unwrap();
    assert_eq!(database.runtime_mention_seq(&agent.agent_id, 0.into()).unwrap(), 0.into());
}

#[test]
fn mention_recovery_only_finds_new_visible_external_mentions() {
    let (_directory, mut database, agent) = fixture();
    human(&mut database);
    assert_eq!(
        database
            .runtime_mention_seq(&agent.agent_id, 0.into())
            .unwrap(),
        0.into()
    );
    let mut send = |mention_ids, mention_all| {
        database
            .send_message(ChatSendRequest {
                data_generation_id: database.generation_id.clone(),
                client_request_id: Uuid::now_v7().to_string(),
                parts: vec![MessagePart::Text {
                    text: "提及恢复测试".into(),
                }],
                quote_message_id: None,
                mention_ids,
                mention_all,
            })
            .unwrap()
            .0
    };
    let direct = send(vec![agent.agent_id.clone()], false);
    let all = send(Vec::new(), true);
    let own = send(vec![agent.agent_id.clone()], false);
    let recalled = send(vec![agent.agent_id.clone()], false);
    let deleted = send(Vec::new(), true);
    database
        .conn
        .execute(
            "UPDATE messages SET sender_id=?1 WHERE id=?2",
            params![agent.agent_id, own.message_id],
        )
        .unwrap();
    database
        .conn
        .execute(
            "UPDATE messages SET state='recalled' WHERE id=?1",
            [&recalled.message_id],
        )
        .unwrap();
    database
        .conn
        .execute(
            "UPDATE messages SET state='deleted' WHERE id=?1",
            [&deleted.message_id],
        )
        .unwrap();
    assert_eq!(
        database
            .runtime_mention_seq(&agent.agent_id, 0.into())
            .unwrap(),
        all.message_seq
    );
    assert_eq!(
        database
            .runtime_mention_seq(&agent.agent_id, direct.message_seq.clone())
            .unwrap(),
        all.message_seq
    );
    assert_eq!(
        database
            .runtime_mention_seq(&agent.agent_id, all.message_seq)
            .unwrap(),
        0.into()
    );
    database
        .conn
        .execute(
            "UPDATE messages SET state='recalled' WHERE id=?1",
            [&all.message_id],
        )
        .unwrap();
    assert_eq!(
        database
            .runtime_mention_seq(&agent.agent_id, 0.into())
            .unwrap(),
        direct.message_seq
    );
    assert_eq!(
        database
            .runtime_mention_seq(&database.local_user_id, 0.into())
            .unwrap(),
        0.into()
    );
    code(
        database.runtime_mention_seq(&agent.agent_id, DecimalString("-1".into())),
        ErrorCode::InvalidInput,
    );
}

fn experience_candidate(database: &mut Database, agent: &AgentConfiguration) -> RuntimeExperience {
    let input = database.runtime_input(&agent.agent_id).unwrap();
    RuntimeExperience {
        data_generation_id: database.generation_id.clone(),
        agent_id: agent.agent_id.clone(),
        config_revision: agent.revision.clone(),
        observed_through_seq: input.snapshot.latest_message_seq,
        observed_content_epoch: input.snapshot.room.content_epoch,
        decision_id: None,
        experience_revision: input.experience_revision,
        content: "本地测试中获知的真实经历".into(),
        score: 73,
        cancellation: CancellationToken::new(),
    }
}

#[test]
fn experience_crud_checks_generation_and_agent_and_reads_after_deletion() {
    let (_directory, mut database, agent) = fixture();
    let request = ExperienceAgentRequest { data_generation_id: database.generation_id.clone(), agent_id: agent.agent_id.clone() };
    code(database.list_experience(ExperienceAgentRequest { data_generation_id: "stale".into(), ..request.clone() }), ErrorCode::DataGenerationChanged);
    for id in ["missing-agent".into(), database.local_user_id.clone(), "../outside".into()] {
        code(database.list_experience(ExperienceAgentRequest { agent_id: id, ..request.clone() }), ErrorCode::InvalidInput);
    }
    let before = database.runtime_input(&agent.agent_id).unwrap();
    let entry = database.add_experience(ExperienceAddRequest {
        data_generation_id: request.data_generation_id.clone(), agent_id: request.agent_id.clone(), content: "记录由人工提供".into(), score: 91,
    }).unwrap();
    let after = database.runtime_input(&agent.agent_id).unwrap();
    assert_eq!(after.experiences[0].id, entry.id);
    assert_ne!(before.experience_revision, after.experience_revision);
    let pending = experience_candidate(&mut database, &agent);
    database.delete_experience(ExperienceDeleteRequest {
        data_generation_id: request.data_generation_id, agent_id: request.agent_id, entry_id: entry.id,
    }).unwrap();
    code(database.record_experience(pending), ErrorCode::ConfigConflict);
    assert!(database.runtime_input(&agent.agent_id).unwrap().experiences.is_empty());
}

#[test]
fn cancelled_or_stale_experience_decisions_never_publish() {
    let (_directory, mut database, agent) = fixture();
    let cancelled = experience_candidate(&mut database, &agent);
    cancelled.cancellation.cancel();
    code(database.record_experience(cancelled), ErrorCode::ShuttingDown);
    let stale_generation = RuntimeExperience { data_generation_id: "old-generation".into(), ..experience_candidate(&mut database, &agent) };
    code(database.record_experience(stale_generation), ErrorCode::DataGenerationChanged);
    let stale_message = experience_candidate(&mut database, &agent);
    human(&mut database);
    code(database.record_experience(stale_message), ErrorCode::ConfigConflict);
    let stale_epoch = experience_candidate(&mut database, &agent);
    database.conn.execute("UPDATE room SET content_epoch=content_epoch+1", []).unwrap();
    code(database.record_experience(stale_epoch), ErrorCode::ConfigConflict);
    let stale_configuration = experience_candidate(&mut database, &agent);
    save_agent(&mut database, agent.clone());
    code(database.record_experience(stale_configuration), ErrorCode::ConfigConflict);
    assert!(database.list_experience(ExperienceAgentRequest { data_generation_id: database.generation_id.clone(), agent_id: agent.agent_id }).unwrap().is_empty());
}

#[test]
fn valid_observation_and_committed_speech_can_publish_experience() {
    let (_directory, mut database, agent) = fixture();
    let observing = experience_candidate(&mut database, &agent);
    database.record_experience(observing).unwrap();
    let mut pending = experience_candidate(&mut database, &agent);
    pending.content = "发言成功后才记录的经历".into();
    pending.decision_id = Some("experience-speech".into());
    code(database.record_experience(pending.clone()), ErrorCode::ConfigConflict);
    let mut message = candidate(&agent, 0, "experience-speech", 0, "experience-chain");
    message.observed_experience_revision = pending.experience_revision.clone();
    database.commit_runtime_message(message).unwrap();
    database.record_experience(pending).unwrap();
    let entries = database.list_experience(ExperienceAgentRequest { data_generation_id: database.generation_id.clone(), agent_id: agent.agent_id }).unwrap();
    assert_eq!(entries.len(), 2);
    assert!(entries.iter().all(|entry| entry.score == 73));
}

#[test]
fn experience_change_invalidates_delayed_speech_and_external_messages_invalidate_speech_memory() {
    let (_directory, mut database, agent) = fixture();
    let entry = database.add_experience(ExperienceAddRequest {
        data_generation_id: database.generation_id.clone(), agent_id: agent.agent_id.clone(), content: "将被手动删除的经历".into(), score: 80,
    }).unwrap();
    let mut delayed = candidate(&agent, 0, "delayed-experience", 0, "experience-chain");
    delayed.observed_experience_revision = database.runtime_input(&agent.agent_id).unwrap().experience_revision;
    database.delete_experience(ExperienceDeleteRequest {
        data_generation_id: database.generation_id.clone(), agent_id: agent.agent_id.clone(), entry_id: entry.id,
    }).unwrap();
    code(database.commit_runtime_message(delayed), ErrorCode::ConfigConflict);
    let mut pending = experience_candidate(&mut database, &agent);
    pending.decision_id = Some("committed-experience".into());
    database.commit_runtime_message(candidate(&agent, 0, "committed-experience", 0, "experience-chain")).unwrap();
    human(&mut database);
    code(database.record_experience(pending), ErrorCode::ConfigConflict);
}

#[test]
fn quote_context_loads_older_originals_and_excludes_recalled_originals() {
    let (_directory, mut database, agent) = fixture();
    let original = human(&mut database);
    for _ in 0..65 { human(&mut database); }
    database.send_message(ChatSendRequest {
        data_generation_id: database.generation_id.clone(), client_request_id: Uuid::now_v7().to_string(),
        parts: vec![MessagePart::Text { text: "引用分页外原文".into() }], quote_message_id: Some(original.message_id.clone()), mention_ids: vec![], mention_all: false,
    }).unwrap();
    let input = database.runtime_input(&agent.agent_id).unwrap();
    assert!(!input.messages.iter().any(|message| message.id == original.message_id));
    assert_eq!(input.quoted_messages[0].id, original.message_id);
    database.conn.execute("UPDATE messages SET state='recalled' WHERE id=?1", [&original.message_id]).unwrap();
    assert!(database.runtime_input(&agent.agent_id).unwrap().quoted_messages.is_empty());
}

#[tokio::test(flavor = "current_thread")]
async fn experience_worker_serializes_parallel_additions_without_losing_entries() {
    let directory = TempDir::new().unwrap();
    let worker = DbWorker::open(directory.path(), "experience-worker".into(), Arc::new(|_| {})).unwrap();
    let agent_id = worker.list_agents(AgentListRequest { data_generation_id: "experience-worker".into() }).await.unwrap()[0].agent_id.clone();
    let mut jobs = Vec::new();
    for index in 0..16 {
        let worker = worker.clone();
        let agent_id = agent_id.clone();
        jobs.push(tokio::spawn(async move {
            worker.add_experience(ExperienceAddRequest {
                data_generation_id: "experience-worker".into(), agent_id, content: format!("并发经历 {index}"), score: 50,
            }).await.unwrap();
        }));
    }
    for job in jobs { job.await.unwrap(); }
    let entries = worker.list_experience(ExperienceAgentRequest { data_generation_id: "experience-worker".into(), agent_id }).await.unwrap();
    assert_eq!(entries.len(), 16);
    worker.shutdown().await.unwrap();
}

#[test]
fn agent_recalls_only_its_own_recent_messages() {
    let (_directory, mut database, agent) = fixture();
    let generation = database.generation_id.clone();

    // 智能体能撤回自己刚提交的消息。
    let sent = database
        .commit_runtime_message(candidate(&agent, 0, "recall-own", 0, "recall-chain"))
        .unwrap()
        .0;
    database
        .recall_agent_message(&agent.agent_id, &sent.message_id, &generation)
        .unwrap();
    let state: String = database
        .conn
        .query_row(
            "SELECT state FROM messages WHERE id=?1",
            [&sent.message_id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(state, "recalled");
    // 同一条不能重复撤回。
    assert!(
        database
            .recall_agent_message(&agent.agent_id, &sent.message_id, &generation)
            .is_err()
    );

    // 不能撤回本地用户的消息。
    let external = human(&mut database);
    let error = database
        .recall_agent_message(&agent.agent_id, &external.message_id, &generation)
        .unwrap_err();
    assert_eq!(error.code, ErrorCode::PermissionDenied);
}

#[test]
fn agent_recall_cleanup_keeps_three_minute_anchors() {
    for (age, retained) in [(150, true), (181, false)] {
        let (_directory, mut database, agent) = fixture();
        let generation = database.generation_id.clone();
        let sent = database.commit_runtime_message(candidate(&agent, 0, "anchor-source", 0, "anchor-chain")).unwrap().0;
        let anchor = Instant::now() - std::time::Duration::from_secs(age);
        database.recall_anchors.insert(sent.message_id.clone(), anchor);
        database.commit_runtime_message(candidate(&agent, 1, "anchor-new", 0, "anchor-chain")).unwrap();
        assert_eq!(database.recall_anchors.contains_key(&sent.message_id), retained);
        let result = database.recall_agent_message(&agent.agent_id, &sent.message_id, &generation);
        if retained { assert!(result.is_ok()); }
        else { code(result, ErrorCode::PermissionDenied); }
    }
}

#[test]
fn worker_agent_recall_broadcasts_only_after_commit_and_not_on_failure() {
    let directory = TempDir::new().unwrap();
    let callbacks = Arc::new(Mutex::new(Vec::new()));
    let received = callbacks.clone();
    let path = directory.path().join("chat.sqlite3");
    let generation = "worker-agent-recall".to_owned();
    let worker = DbWorker::open(directory.path(), generation.clone(), Arc::new(move |event| {
        let reader = open_reader(&path).unwrap();
        assert!(reader.query_row("SELECT EXISTS(SELECT 1 FROM domain_events WHERE id=?1)", [&event.event_id], |row| row.get::<_, bool>(0)).unwrap());
        if let EventPayload::MessageChanged { message_id, .. } = &event.payload {
            assert_eq!(reader.query_row("SELECT state FROM messages WHERE id=?1", [message_id], |row| row.get::<_, String>(0)).unwrap(), "recalled");
        }
        received.lock().unwrap().push(event.clone());
    })).unwrap();
    let agent = tauri::async_runtime::block_on(worker.call(|db| Ok(configured(db)))).unwrap();
    let sent = tauri::async_runtime::block_on(worker.commit_runtime_message(candidate(&agent, 0, "worker-recall", 0, "worker-chain"))).unwrap();
    callbacks.lock().unwrap().clear();
    tauri::async_runtime::block_on(worker.recall_agent_message(agent.agent_id.clone(), sent.message_id.clone(), generation.clone())).unwrap();
    {
        let events = callbacks.lock().unwrap();
        assert_eq!(events.len(), 1);
        assert!(matches!(&events[0].payload, EventPayload::MessageChanged { message_id, message_seq, room }
            if message_id == &sent.message_id && message_seq == &sent.message_seq && room.content_epoch == 1.into()));
    }
    code(tauri::async_runtime::block_on(worker.recall_agent_message(agent.agent_id.clone(), sent.message_id, generation.clone())), ErrorCode::MessageNotFound);
    let external = tauri::async_runtime::block_on(worker.call(|db| Ok(human(db)))).unwrap();
    code(tauri::async_runtime::block_on(worker.recall_agent_message(agent.agent_id, external.message_id, generation)), ErrorCode::PermissionDenied);
    assert_eq!(callbacks.lock().unwrap().len(), 1);
    tauri::async_runtime::block_on(worker.shutdown()).unwrap();
}
