use std::{
    fs,
    path::{Path, PathBuf},
};

use rusqlite::{Connection, params};
use serde::Serialize;
use serde_json::{Value, json};
use tempfile::TempDir;
use uuid::Uuid;

use crate::domain::{contracts::*, error::AppResult};

use super::{
    backup::backup_database,
    configuration::seed_configuration,
    database::{
        CURRENT_SCHEMA, Database, MIGRATION, MIGRATION_V2, MIGRATION_V3, configure_connection,
        fingerprint, migration_hash, open_reader, verify_database,
    },
};

const GENERATION: &str = "configuration-tests";
const LEGACY_USER: &str = "legacy-user";
const LEGACY_AGENT: &str = "legacy-sage";
const LEGACY_ROOM: &str = "legacy-room";
const LEGACY_MESSAGE: &str = "legacy-message";
const LEGACY_EVENT: &str = "legacy-event";
const MESSAGE_HIGH_WATER: i64 = 4096;
const EVENT_HIGH_WATER: i64 = 8192;
const LEGACY_EVENT_SEQUENCE: i64 = EVENT_HIGH_WATER - 1;

fn database() -> (TempDir, Database) {
    let directory = TempDir::new().unwrap();
    let database = Database::open(directory.path(), GENERATION.into()).unwrap();
    (directory, database)
}

fn value<T: Serialize>(value: &T) -> Value {
    serde_json::to_value(value).unwrap()
}

fn count(conn: &Connection, table: &str) -> i64 {
    conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| {
        row.get(0)
    })
    .unwrap()
}

fn sequence(conn: &Connection, table: &str) -> i64 {
    conn.query_row(
        "SELECT seq FROM sqlite_sequence WHERE name=?1",
        [table],
        |row| row.get(0),
    )
    .unwrap()
}

fn schema_version(conn: &Connection) -> u32 {
    conn.pragma_query_value(None, "user_version", |row| row.get(0))
        .unwrap()
}

fn root_id(conn: &Connection) -> String {
    conn.query_row(
        "SELECT root_id FROM app_meta WHERE singleton=1",
        [],
        |row| row.get(0),
    )
    .unwrap()
}

fn assert_code<T>(result: AppResult<T>, code: ErrorCode) {
    match result {
        Err(error) => assert_eq!(error.code, code, "{}", error.message),
        Ok(_) => panic!("operation unexpectedly succeeded; expected {code:?}"),
    }
}

fn model_profile() -> ModelProfileInput {
    ModelProfileInput {
        id: "fixture-model".into(),
        name: "独立模型预设".into(),
        protocol: ModelProtocol::OpenaiChatCompletions,
        base_url: "https://model.example.invalid/v1".into(),
        model_name: "fixture-model-name".into(),
        parameters: ModelParameters {
            temperature: 0.5,
            top_p: 0.9,
            max_output_tokens: 1024,
            input_budget: 4096,
            reasoning: ReasoningMode::Off,
        },
    }
}

fn global_request(
    database: &Database,
    request_id: &str,
    current: &GlobalConfiguration,
) -> GlobalConfigurationSaveRequest {
    GlobalConfigurationSaveRequest {
        data_generation_id: database.generation_id.clone(),
        client_request_id: request_id.into(),
        expected_revision: current.revision.clone(),
        model_profiles: current
            .model_profiles
            .iter()
            .map(ModelProfile::input)
            .collect(),
        persona_presets: current.persona_presets.clone(),
        runtime_defaults: current.runtime_defaults.clone(),
    }
}

fn install_presets(database: &mut Database) -> GlobalConfiguration {
    let current = database
        .get_global_configuration(&database.generation_id)
        .unwrap();
    let mut request = global_request(database, "install-presets", &current);
    request.model_profiles = vec![model_profile()];
    request.persona_presets[0].language_style = "原始人格语言风格".into();
    request.persona_presets[0].address_terms = vec!["朋友".into()];
    request.persona_presets[0].skill = "原始人格技能".into();
    request.persona_presets[0].dimensions.humor = 25;
    database.save_global_configuration(request).unwrap().0
}

fn agent_with_snapshot(database: &Database, global: &GlobalConfiguration) -> AgentConfiguration {
    let mut agent = database
        .list_agents(&database.generation_id)
        .unwrap()
        .remove(0);
    let persona = &global.persona_presets[0];
    agent.language_style = persona.language_style.clone();
    agent.address_terms = persona.address_terms.clone();
    agent.skill = persona.skill.clone();
    agent.dimensions = persona.dimensions.clone();
    agent.model = Some(AgentModelSnapshot {
        source_profile_id: global.model_profiles[0].id.clone(),
        source_profile_revision: global.model_profiles[0].revision.clone(),
        profile: global.model_profiles[0].input(),
    });
    agent
}

fn save_agent(
    database: &mut Database,
    request_id: &str,
    agent: AgentConfiguration,
    expected: Option<DecimalString>,
) -> AgentConfiguration {
    database
        .save_agent(AgentSaveRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: request_id.into(),
            expected_revision: expected,
            configuration: agent,
        })
        .unwrap()
        .0
}

fn send(database: &mut Database, request_id: &str, text: &str) -> ChatSendResult {
    database
        .send_message(ChatSendRequest {
            data_generation_id: database.generation_id.clone(),
            client_request_id: request_id.into(),
            parts: vec![MessagePart::Text { text: text.into() }],
            quote_message_id: None,
            mention_ids: Vec::new(),
            mention_all: false,
        })
        .unwrap()
        .0
}

fn messages(database: &mut Database) -> MessagePage {
    database
        .list_messages(ChatListRequest {
            data_generation_id: database.generation_id.clone(),
            before_seq: None,
            after_seq: None,
            around_seq: None,
            limit: 100,
        })
        .unwrap()
}

fn write_json(path: &Path, content: &Value) {
    fs::write(path, serde_json::to_vec(content).unwrap()).unwrap();
}

fn read_json(path: &Path) -> Value {
    serde_json::from_slice(&fs::read(path).unwrap()).unwrap()
}

fn legacy_fixture() -> TempDir {
    let directory = TempDir::new().unwrap();
    let mut conn = Connection::open(directory.path().join("chat.sqlite3")).unwrap();
    configure_connection(&conn).unwrap();
    conn.pragma_update(None, "journal_mode", "DELETE").unwrap();
    let identity = Uuid::now_v7().to_string();
    let transaction = conn.transaction().unwrap();
    transaction.execute_batch(MIGRATION).unwrap();
    transaction
        .execute(
            "INSERT INTO app_meta VALUES (1,?1,1,?2)",
            params![identity, migration_hash(1)],
        )
        .unwrap();
    transaction
        .execute(
            "INSERT INTO participants VALUES (?1,'user','旧昵称','旧用户资料','present',NULL,1000)",
            [LEGACY_USER],
        )
        .unwrap();
    transaction.execute("INSERT INTO participants VALUES (?1,'agent','Sage','旧智能体资料','needs_configuration','sage',1001)", [LEGACY_AGENT]).unwrap();
    transaction
        .execute(
            "INSERT INTO room VALUES (1,?1,'旧群名',?2,7,3)",
            params![LEGACY_ROOM, LEGACY_USER],
        )
        .unwrap();
    transaction
        .execute("INSERT INTO app_settings VALUES (1,'dark',1,4)", [])
        .unwrap();
    let snapshot = legacy_sender_json();
    transaction.execute("INSERT INTO messages(seq,id,room_id,sender_id,sender_snapshot_json,created_at) VALUES (17,?1,?2,?3,?4,2000)", params![LEGACY_MESSAGE, LEGACY_ROOM, LEGACY_USER, snapshot]).unwrap();
    transaction
        .execute(
            "INSERT INTO message_parts VALUES (?1,0,'text','schema 1 保留的历史文本')",
            [LEGACY_MESSAGE],
        )
        .unwrap();
    transaction
        .execute(
            "INSERT INTO search_text VALUES (17,'schema 1 保留的历史文本')",
            [],
        )
        .unwrap();
    transaction
        .execute(
            "INSERT INTO message_search(message_search) VALUES ('rebuild')",
            [],
        )
        .unwrap();
    transaction.execute("INSERT INTO messages(seq,id,room_id,sender_id,sender_snapshot_json,created_at) VALUES (?1,'removed-high-water-message',?2,?3,?4,2001)", params![MESSAGE_HIGH_WATER, LEGACY_ROOM, LEGACY_USER, snapshot]).unwrap();
    transaction
        .execute(
            "DELETE FROM messages WHERE id='removed-high-water-message'",
            [],
        )
        .unwrap();
    let payload = serde_json::to_string(&EventPayload::MessageCommitted {
        message_id: LEGACY_MESSAGE.into(),
        message_seq: 17_i64.into(),
        sender_id: LEGACY_USER.into(),
    })
    .unwrap();
    transaction
        .execute(
            "INSERT INTO domain_events VALUES (?1,?2,2000,?3)",
            params![LEGACY_EVENT_SEQUENCE, LEGACY_EVENT, payload],
        )
        .unwrap();
    transaction
        .execute(
            "INSERT INTO domain_events VALUES (?1,'removed-high-water-event',2001,?2)",
            params![EVENT_HIGH_WATER, payload],
        )
        .unwrap();
    transaction
        .execute(
            "DELETE FROM domain_events WHERE id='removed-high-water-event'",
            [],
        )
        .unwrap();
    transaction.commit().unwrap();
    verify_database(&conn).unwrap();
    assert_eq!(schema_version(&conn), 1);
    conn.close().unwrap();
    write_json(
        &directory.path().join("data-manifest.json"),
        &json!({
            "format_version": 1, "root_id": identity, "schema_version": 1,
        }),
    );
    directory
}

fn legacy_sender_json() -> String {
    json!({"display_name": "旧昵称", "kind": "user"}).to_string()
}

fn assert_legacy(conn: &Connection, version: u32) {
    verify_database(conn).unwrap();
    assert_eq!(schema_version(conn), version);
    let (metadata_version, hash): (u32, String) = conn
        .query_row(
            "SELECT schema_version,migration_hash FROM app_meta WHERE singleton=1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap();
    assert_eq!(metadata_version, version);
    assert_eq!(hash, migration_hash(version));
    let (room, owner, name, revision, epoch): (String, String, String, i64, i64) = conn
        .query_row(
            "SELECT id,owner_participant_id,name,version,content_epoch FROM room WHERE singleton=1",
            [],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            },
        )
        .unwrap();
    assert_eq!(
        (
            room.as_str(),
            owner.as_str(),
            name.as_str(),
            revision,
            epoch
        ),
        (LEGACY_ROOM, LEGACY_USER, "旧群名", 7, 3)
    );
    for (id, kind) in [(LEGACY_USER, "user"), (LEGACY_AGENT, "agent")] {
        let actual: String = conn
            .query_row("SELECT kind FROM participants WHERE id=?1", [id], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(actual, kind);
    }
    let (sequence, sender, snapshot): (i64, String, String) = conn
        .query_row(
            "SELECT seq,sender_id,sender_snapshot_json FROM messages WHERE id=?1",
            [LEGACY_MESSAGE],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .unwrap();
    assert_eq!(sequence, 17);
    assert_eq!(sender, LEGACY_USER);
    assert_eq!(snapshot, legacy_sender_json());
    assert_eq!(count(conn, "message_parts"), count(conn, "messages"));
    let event_id: String = conn
        .query_row(
            "SELECT id FROM domain_events WHERE seq=?1",
            [LEGACY_EVENT_SEQUENCE],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(event_id, LEGACY_EVENT);
}

fn backup_paths(root: &Path) -> Vec<PathBuf> {
    let mut paths: Vec<_> = fs::read_dir(root.join("backups"))
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .filter(|path| path.extension().and_then(|extension| extension.to_str()) == Some("sqlite3"))
        .collect();
    paths.sort();
    paths
}

fn prepare_upgrade_journal(directory: &TempDir) -> (String, PathBuf) {
    prepare_versioned_upgrade_journal(directory, 1)
}

fn prepare_versioned_upgrade_journal(directory: &TempDir, from_version: u32) -> (String, PathBuf) {
    let conn = open_reader(&directory.path().join("chat.sqlite3")).unwrap();
    let identity = root_id(&conn);
    assert_eq!(schema_version(&conn), from_version);
    let snapshot_id = Uuid::now_v7().to_string();
    fs::create_dir_all(directory.path().join("backups")).unwrap();
    let snapshot = directory
        .path()
        .join("backups")
        .join(format!("{snapshot_id}.sqlite3"));
    backup_database(&conn, &snapshot).unwrap();
    write_json(
        &directory.path().join("schema-upgrade.json"),
        &json!({
            "root_id": identity, "from_version": from_version, "to_version": from_version + 1,
            "migration_hash": migration_hash(from_version + 1), "snapshot_id": snapshot_id,
        }),
    );
    (snapshot_id, snapshot)
}

fn commit_v2(directory: &TempDir) {
    let mut conn = Connection::open(directory.path().join("chat.sqlite3")).unwrap();
    configure_connection(&conn).unwrap();
    let transaction = conn.transaction().unwrap();
    transaction.execute_batch(MIGRATION_V2).unwrap();
    seed_configuration(&transaction).unwrap();
    transaction
        .execute(
            "UPDATE app_meta SET schema_version=2,migration_hash=?1 WHERE singleton=1",
            [migration_hash(2)],
        )
        .unwrap();
    verify_database(&transaction).unwrap();
    transaction.commit().unwrap();
    conn.close().unwrap();
}

#[test]
fn unconfigured_presets_save_replay_reopen_but_cannot_bind_or_be_adopted() {
    let (directory, mut database) = database();
    let initial = database.get_global_configuration(GENERATION).unwrap();
    let mut request = global_request(&database, "save-unconfigured", &initial);
    for (index, base_url, model_name) in [
        (0, "", ""),
        (1, "https://model.example.invalid/v1", ""),
        (2, "", "fixture-model"),
    ] {
        let mut profile = model_profile();
        profile.id = format!("unconfigured-{index}");
        profile.base_url = base_url.into();
        profile.model_name = model_name.into();
        request.model_profiles.push(profile);
    }
    let (saved, event) = database.save_global_configuration(request.clone()).unwrap();
    assert!(event.is_some());
    let (replay, event) = database.save_global_configuration(request).unwrap();
    assert_eq!(value(&saved), value(&replay));
    assert!(event.is_none());
    for profile in &saved.model_profiles {
        assert!(!profile.credential_configured);
        assert_code(
            database.replace_credential_reference(
                &profile.id,
                &profile.revision,
                Some(Uuid::now_v7().to_string()),
            ),
            ErrorCode::InvalidInput,
        );
        let mut agent = database.list_agents(GENERATION).unwrap().remove(0);
        agent.model = Some(AgentModelSnapshot {
            source_profile_id: profile.id.clone(),
            source_profile_revision: profile.revision.clone(),
            profile: profile.input(),
        });
        assert_code(
            database.save_agent(AgentSaveRequest {
                data_generation_id: GENERATION.into(),
                client_request_id: format!("adopt-{}", profile.id),
                expected_revision: Some(agent.revision.clone()),
                configuration: agent.clone(),
            }),
            ErrorCode::InvalidInput,
        );
        // 在快照里补字段也不能采用未配置的来源历史版本。
        let snapshot = agent.model.as_mut().unwrap();
        if snapshot.profile.model_name.is_empty() {
            snapshot.profile.model_name = "forged-complete".into();
        }
        if !snapshot.profile.base_url.is_empty() {
            assert_code(
                database.save_agent(AgentSaveRequest {
                    data_generation_id: GENERATION.into(),
                    client_request_id: format!("forged-{}", profile.id),
                    expected_revision: Some(agent.revision.clone()),
                    configuration: agent,
                }),
                ErrorCode::InvalidInput,
            );
        }
    }
    assert_eq!(count(&database.conn, "credential_bindings"), 0);
    assert_eq!(count(&database.conn, "domain_events"), 1);
    drop(database);
    let reopened = Database::open(directory.path(), "reopened-empty".into()).unwrap();
    assert_eq!(
        value(&reopened.get_global_configuration("reopened-empty").unwrap()),
        value(&saved)
    );
}

#[test]
fn incomplete_presets_still_reject_invalid_nonempty_urls_and_strict_values() {
    let (_directory, mut database) = database();
    let current = database.get_global_configuration(GENERATION).unwrap();
    for (index, url) in [
        "http://model.example.invalid/v1",
        "https://user@model.example.invalid",
        "https://@model.example.invalid",
        "https://user:password@model.example.invalid",
        " https://model.example.invalid",
        "https://model.example.invalid/?key=x",
        "https://model.example.invalid/#x",
        "https://model.example.invalid/\npath",
        "ftp://model.example.invalid",
        " ",
    ]
    .into_iter()
    .enumerate()
    {
        let mut request =
            global_request(&database, &format!("invalid-empty-url-{index}"), &current);
        let mut profile = model_profile();
        profile.model_name.clear();
        profile.base_url = url.into();
        request.model_profiles.push(profile);
        assert_code(
            database.save_global_configuration(request),
            ErrorCode::InvalidInput,
        );
    }
    for case in 0..3 {
        let mut request =
            global_request(&database, &format!("invalid-empty-values-{case}"), &current);
        let mut profile = model_profile();
        profile.base_url.clear();
        profile.model_name.clear();
        match case {
            0 => profile.name.clear(),
            1 => profile.parameters.top_p = 0.0,
            _ => request.persona_presets[0].dimensions.humor = 101,
        }
        request.model_profiles.push(profile);
        assert_code(
            database.save_global_configuration(request),
            ErrorCode::InvalidInput,
        );
    }
    for (index, url) in [
        "http://127.0.0.1:8080/v1",
        "http://localhost:8080/v1",
        "http://[::1]:8080/v1",
    ]
    .into_iter()
    .enumerate()
    {
        let mut request = global_request(
            &database,
            &format!("valid-loopback-{index}"),
            &database.get_global_configuration(GENERATION).unwrap(),
        );
        let mut profile = model_profile();
        profile.base_url = url.into();
        profile.model_name.clear();
        request.model_profiles = vec![profile];
        database.save_global_configuration(request).unwrap();
    }
}

#[test]
fn global_save_replay_does_not_repeat_events_or_overwrite_later_configuration() {
    let (_directory, mut database) = database();
    let initial = database.get_global_configuration(GENERATION).unwrap();
    let mut request = global_request(&database, "global-idempotent", &initial);
    request.model_profiles.push(model_profile());
    let (saved, event) = database.save_global_configuration(request.clone()).unwrap();
    assert_eq!(saved.revision.0, "2");
    assert!(
        matches!(event.unwrap().payload, EventPayload::GlobalConfigurationChanged { revision } if revision == saved.revision)
    );
    let mut later_request = global_request(&database, "global-later", &saved);
    later_request.model_profiles[0].name = "后续真实保存".into();
    let later = database.save_global_configuration(later_request).unwrap().0;
    let (replayed, duplicate) = database.save_global_configuration(request.clone()).unwrap();
    assert_eq!(value(&replayed), value(&saved));
    assert!(duplicate.is_none());
    assert_eq!(count(&database.conn, "domain_events"), 2);
    assert_eq!(count(&database.conn, "request_records"), 2);
    assert_eq!(
        value(&database.get_global_configuration(GENERATION).unwrap()),
        value(&later)
    );
    request.model_profiles[0].model_name = "same-id-different-payload".into();
    assert_code(
        database.save_global_configuration(request),
        ErrorCode::IdempotencyConflict,
    );
    assert_eq!(count(&database.conn, "domain_events"), 2);
    assert_eq!(
        value(&database.get_global_configuration(GENERATION).unwrap()),
        value(&later)
    );
}

#[test]
fn global_revision_conflict_rolls_back_and_restart_reads_committed_value() {
    let (directory, mut database) = database();
    let saved = install_presets(&mut database);
    let mut conflict = global_request(&database, "stale-global-revision", &saved);
    conflict.expected_revision = 1_i64.into();
    conflict.model_profiles[0].name = "不能提交的新名称".into();
    conflict.persona_presets[0].skill = "不能提交的新技能".into();
    conflict.runtime_defaults.request_limit_daily = 50;
    assert_code(
        database.save_global_configuration(conflict),
        ErrorCode::ConfigConflict,
    );
    assert_eq!(
        value(&database.get_global_configuration(GENERATION).unwrap()),
        value(&saved)
    );
    assert_eq!(count(&database.conn, "domain_events"), 1);
    assert_eq!(count(&database.conn, "request_records"), 1);
    assert_eq!(count(&database.conn, "model_profile_versions"), 1);
    drop(database);
    let restarted = Database::open(directory.path(), "configuration-restarted".into()).unwrap();
    assert_eq!(
        value(
            &restarted
                .get_global_configuration("configuration-restarted")
                .unwrap()
        ),
        value(&saved)
    );
}

#[test]
fn copied_agents_and_model_persona_snapshots_are_independent_of_global_edits() {
    let (directory, mut database) = database();
    let global = install_presets(&mut database);
    let original = agent_with_snapshot(&database, &global);
    let original_revision = original.revision.clone();
    let original = save_agent(
        &mut database,
        "configure-original",
        original,
        Some(original_revision),
    );
    let mut copy = original.clone();
    copy.agent_id = Uuid::now_v7().to_string();
    copy.revision = 0_i64.into();
    copy.display_name = "Sage 副本".into();
    let copy = save_agent(&mut database, "copy-agent", copy, None);
    let mut edited = copy.clone();
    edited.language_style = "副本独立语言风格".into();
    edited.address_terms = vec!["同伴".into()];
    edited.skill = "副本独立技能".into();
    edited.dimensions.humor = 90;
    edited.model.as_mut().unwrap().profile.model_name = "copy-specific-model".into();
    edited
        .model
        .as_mut()
        .unwrap()
        .profile
        .parameters
        .temperature = 0.8;
    let copy = save_agent(&mut database, "edit-copy", edited, Some(copy.revision));
    let mut update = global_request(&database, "edit-global-after-copy", &global);
    update.model_profiles[0].model_name = "new-global-model".into();
    update.model_profiles[0].base_url = "https://new-global.example.invalid/v1".into();
    update.model_profiles[0].parameters.temperature = 0.1;
    update.persona_presets[0].language_style = "新的全局人格风格".into();
    update.persona_presets[0].skill = "新的全局人格技能".into();
    update.persona_presets[0].dimensions.humor = 5;
    update.runtime_defaults.request_limit_daily = 10;
    let updated = database.save_global_configuration(update).unwrap().0;
    assert_eq!(updated.model_profiles[0].revision.0, "2");
    let agents = database.list_agents(GENERATION).unwrap();
    assert_eq!(
        agents
            .iter()
            .find(|agent| agent.agent_id == original.agent_id)
            .unwrap(),
        &original
    );
    assert_eq!(
        agents
            .iter()
            .find(|agent| agent.agent_id == copy.agent_id)
            .unwrap(),
        &copy
    );
    assert_eq!(
        original.model.as_ref().unwrap().source_profile_revision.0,
        "1"
    );
    assert_eq!(copy.model.as_ref().unwrap().source_profile_revision.0, "1");
    let original_history: String = database
        .conn
        .query_row(
            "SELECT configuration_json FROM agent_config_versions WHERE agent_id=?1 AND revision=2",
            [&original.agent_id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(
        serde_json::from_str::<AgentConfiguration>(&original_history).unwrap(),
        original
    );
    assert_eq!(count(&database.conn, "model_profile_versions"), 2);
    drop(database);
    let restarted = Database::open(directory.path(), "agent-restarted".into()).unwrap();
    assert_eq!(restarted.list_agents("agent-restarted").unwrap(), agents);
}

#[test]
fn forged_source_endpoint_protocol_identity_and_revision_are_rejected_atomically() {
    let (_directory, mut database) = database();
    let global = install_presets(&mut database);
    let source = agent_with_snapshot(&database, &global);
    let events_before = count(&database.conn, "domain_events");
    let versions_before = count(&database.conn, "agent_config_versions");
    let requests_before = count(&database.conn, "request_records");
    for case in 0..4 {
        let mut forged = source.clone();
        forged.agent_id = format!("forged-agent-{case}");
        let snapshot = forged.model.as_mut().unwrap();
        match case {
            0 => snapshot.profile.base_url = "https://forged.example.invalid/v1".into(),
            1 => snapshot.profile.protocol = ModelProtocol::AnthropicMessages,
            2 => snapshot.profile.id = "different-profile-id".into(),
            _ => snapshot.source_profile_revision = 999_i64.into(),
        }
        assert_code(
            database.save_agent(AgentSaveRequest {
                data_generation_id: GENERATION.into(),
                client_request_id: format!("forged-save-{case}"),
                expected_revision: None,
                configuration: forged,
            }),
            ErrorCode::InvalidInput,
        );
        assert_eq!(count(&database.conn, "participants"), 2);
        assert_eq!(
            count(&database.conn, "agent_config_versions"),
            versions_before
        );
        assert_eq!(count(&database.conn, "domain_events"), events_before);
        assert_eq!(count(&database.conn, "request_records"), requests_before);
    }
    assert_eq!(database.list_agents(GENERATION).unwrap().len(), 1);
}

#[test]
fn agent_save_replay_and_revision_conflict_preserve_active_and_historical_versions() {
    let (_directory, mut database) = database();
    let mut agent = database.list_agents(GENERATION).unwrap().remove(0);
    agent.display_name = "已提交的 Sage".into();
    let request = AgentSaveRequest {
        data_generation_id: GENERATION.into(),
        client_request_id: "agent-replay".into(),
        expected_revision: Some(agent.revision.clone()),
        configuration: agent.clone(),
    };
    let (saved, event) = database.save_agent(request.clone()).unwrap();
    assert!(event.is_some());
    let (replayed, duplicate) = database.save_agent(request).unwrap();
    assert_eq!(replayed, saved);
    assert!(duplicate.is_none());
    agent.display_name = "冲突昵称不能覆盖".into();
    assert_code(
        database.save_agent(AgentSaveRequest {
            data_generation_id: GENERATION.into(),
            client_request_id: "agent-stale".into(),
            expected_revision: Some(1_i64.into()),
            configuration: agent,
        }),
        ErrorCode::ConfigConflict,
    );
    assert_eq!(database.list_agents(GENERATION).unwrap(), vec![saved]);
    assert_eq!(count(&database.conn, "agent_config_versions"), 2);
    assert_eq!(count(&database.conn, "domain_events"), 1);
    assert_eq!(count(&database.conn, "request_records"), 1);
}

#[test]
fn user_profile_rename_preserves_historical_sender_and_survives_restart() {
    let (directory, mut database) = database();
    let before_profile = database.get_user_profile(GENERATION).unwrap();
    let before_message = send(&mut database, "message-before-rename", "改名前的消息");
    let raw_before: String = database
        .conn
        .query_row(
            "SELECT sender_snapshot_json FROM messages WHERE id=?1",
            [&before_message.message_id],
            |row| row.get(0),
        )
        .unwrap();
    let request = UserProfileSaveRequest {
        data_generation_id: GENERATION.into(),
        client_request_id: "rename-user".into(),
        expected_revision: before_profile.revision.clone(),
        display_name: "改名后的用户".into(),
        introduction: "新资料".into(),
        avatar_id: None,
    };
    let (saved, event) = database.save_user_profile(request.clone()).unwrap();
    assert!(
        matches!(event.unwrap().payload, EventPayload::ParticipantProfileChanged { participant } if participant.id == before_profile.participant_id && participant.display_name == saved.display_name)
    );
    let (replayed, duplicate) = database.save_user_profile(request).unwrap();
    assert_eq!(value(&replayed), value(&saved));
    assert!(duplicate.is_none());
    let after_message = send(&mut database, "message-after-rename", "改名后的消息");
    let page = messages(&mut database);
    assert_eq!(page.items.len(), 2);
    let old = page
        .items
        .iter()
        .find(|message| message.id == before_message.message_id)
        .unwrap();
    let new = page
        .items
        .iter()
        .find(|message| message.id == after_message.message_id)
        .unwrap();
    assert_eq!(
        old.sender_snapshot.display_name,
        before_profile.display_name
    );
    assert_eq!(new.sender_snapshot.display_name, saved.display_name);
    assert_eq!(old.sender_id, new.sender_id);
    let raw_after: String = database
        .conn
        .query_row(
            "SELECT sender_snapshot_json FROM messages WHERE id=?1",
            [&old.id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(raw_before, raw_after);
    assert_eq!(count(&database.conn, "domain_events"), 3);
    drop(database);
    let mut restarted = Database::open(directory.path(), "user-restarted".into()).unwrap();
    assert_eq!(
        value(&restarted.get_user_profile("user-restarted").unwrap()),
        value(&saved)
    );
    let page = messages(&mut restarted);
    assert_eq!(
        page.items
            .iter()
            .find(|message| message.id == before_message.message_id)
            .unwrap()
            .sender_snapshot
            .display_name,
        before_profile.display_name
    );
}

#[test]
fn credential_bindings_are_endpoint_and_protocol_bound_and_history_is_retained() {
    let (_directory, mut database) = database();
    let initial = install_presets(&mut database);
    let profile = &initial.model_profiles[0];
    let first_reference = Uuid::now_v7().to_string();
    let event = database
        .replace_credential_reference(
            &profile.id,
            &profile.revision,
            Some(first_reference.clone()),
        )
        .unwrap();
    let bound = database.get_global_configuration(GENERATION).unwrap();
    assert!(bound.model_profiles[0].credential_configured);
    assert_eq!(bound.model_profiles[0].revision, profile.revision);
    assert!(
        matches!(event.payload, EventPayload::GlobalConfigurationChanged { revision } if revision == bound.revision)
    );
    assert_eq!(
        database.get_model_profile_internal(&profile.id).unwrap().1,
        Some(first_reference.clone())
    );
    let mut update = global_request(&database, "change-model-endpoint", &bound);
    update.model_profiles[0].base_url = "https://second.example.invalid/v1".into();
    let changed = database.save_global_configuration(update).unwrap().0;
    assert!(!changed.model_profiles[0].credential_configured);
    assert_eq!(
        database.get_model_profile_internal(&profile.id).unwrap().1,
        None
    );
    let active: (Option<String>, Option<String>) = database
        .conn
        .query_row(
            "SELECT credential_ref,credential_endpoint FROM model_profiles WHERE id=?1",
            [&profile.id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap();
    assert_eq!(active, (None, None));
    assert_eq!(count(&database.conn, "credential_bindings"), 1);
    let second_reference = Uuid::now_v7().to_string();
    database
        .replace_credential_reference(
            &profile.id,
            &changed.model_profiles[0].revision,
            Some(second_reference.clone()),
        )
        .unwrap();
    let rebound = database.get_global_configuration(GENERATION).unwrap();
    let mut update = global_request(&database, "change-model-protocol", &rebound);
    update.model_profiles[0].protocol = ModelProtocol::AnthropicMessages;
    let changed = database.save_global_configuration(update).unwrap().0;
    assert!(!changed.model_profiles[0].credential_configured);
    assert_eq!(count(&database.conn, "credential_bindings"), 2);
    for (reference, endpoint) in [
        (&first_reference, profile.base_url.as_str()),
        (&second_reference, "https://second.example.invalid/v1"),
    ] {
        let row: (String, String, String) = database
            .conn
            .query_row(
                "SELECT profile_id,endpoint,protocol FROM credential_bindings WHERE reference=?1",
                [reference],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert_eq!(
            row,
            (
                profile.id.clone(),
                endpoint.into(),
                "openai_chat_completions".into()
            )
        );
        database
            .conn
            .execute(
                "UPDATE model_profiles SET credential_ref=?1,credential_endpoint=?2 WHERE id=?3",
                params![reference, endpoint, profile.id],
            )
            .unwrap();
        assert_eq!(
            database.get_model_profile_internal(&profile.id).unwrap().1,
            None
        );
        assert!(
            !database
                .get_global_configuration(GENERATION)
                .unwrap()
                .model_profiles[0]
                .credential_configured
        );
    }
    let current_reference = Uuid::now_v7().to_string();
    database
        .replace_credential_reference(
            &profile.id,
            &changed.model_profiles[0].revision,
            Some(current_reference.clone()),
        )
        .unwrap();
    assert_eq!(
        database.get_model_profile_internal(&profile.id).unwrap().1,
        Some(current_reference)
    );
    database
        .replace_credential_reference(&profile.id, &changed.model_profiles[0].revision, None)
        .unwrap();
    assert_eq!(
        database.get_model_profile_internal(&profile.id).unwrap().1,
        None
    );
    assert_eq!(count(&database.conn, "credential_bindings"), 3);
}

#[test]
fn stale_or_invalid_credential_updates_leave_active_binding_revision_and_events_unchanged() {
    let (_directory, mut database) = database();
    let initial = install_presets(&mut database);
    let profile = &initial.model_profiles[0];
    let reference = Uuid::now_v7().to_string();
    database
        .replace_credential_reference(&profile.id, &profile.revision, Some(reference.clone()))
        .unwrap();
    let before = database.get_global_configuration(GENERATION).unwrap();
    let events = count(&database.conn, "domain_events");
    assert_code(
        database.replace_credential_reference(
            &profile.id,
            &999_i64.into(),
            Some(Uuid::now_v7().to_string()),
        ),
        ErrorCode::ConfigConflict,
    );
    assert_code(
        database.replace_credential_reference(
            &profile.id,
            &profile.revision,
            Some("not-a-uuid".into()),
        ),
        ErrorCode::InvalidInput,
    );
    assert_eq!(
        value(&database.get_global_configuration(GENERATION).unwrap()),
        value(&before)
    );
    assert_eq!(
        database.get_model_profile_internal(&profile.id).unwrap().1,
        Some(reference)
    );
    assert_eq!(count(&database.conn, "domain_events"), events);
    assert_eq!(count(&database.conn, "credential_bindings"), 1);
}

fn commit_v3(directory: &TempDir) {
    let mut conn = Connection::open(directory.path().join("chat.sqlite3")).unwrap();
    configure_connection(&conn).unwrap();
    let transaction = conn.transaction().unwrap();
    transaction.execute_batch(MIGRATION_V3).unwrap();
    transaction
        .execute(
            "UPDATE app_meta SET schema_version=3,migration_hash=?1 WHERE singleton=1",
            [migration_hash(3)],
        )
        .unwrap();
    verify_database(&transaction).unwrap();
    transaction.commit().unwrap();
    conn.close().unwrap();
}

fn schema_two_fixture() -> TempDir {
    let directory = legacy_fixture();
    commit_v2(&directory);
    let conn = open_reader(&directory.path().join("chat.sqlite3")).unwrap();
    write_json(
        &directory.path().join("data-manifest.json"),
        &json!({"format_version":1,"root_id":root_id(&conn),"schema_version":2}),
    );
    directory
}

#[test]
fn schema_one_upgrade_preserves_ids_sender_json_sequences_and_verified_online_backup() {
    let directory = legacy_fixture();
    let old = open_reader(&directory.path().join("chat.sqlite3")).unwrap();
    let identity = root_id(&old);
    assert_legacy(&old, 1);
    assert_eq!(sequence(&old, "messages"), MESSAGE_HIGH_WATER);
    assert_eq!(sequence(&old, "domain_events"), EVENT_HIGH_WATER);
    drop(old);
    let mut database = Database::open(directory.path(), GENERATION.into()).unwrap();
    assert_legacy(&database.conn, CURRENT_SCHEMA);
    assert_eq!(root_id(&database.conn), identity);
    assert_eq!(database.local_user_id, LEGACY_USER);
    assert_eq!(database.room_id, LEGACY_ROOM);
    let snapshot = database
        .snapshot(AppSnapshotRequest {
            data_generation_id: None,
            last_event_seq: None,
        })
        .unwrap();
    assert_eq!(snapshot.room.id, LEGACY_ROOM);
    assert_eq!(snapshot.local_user.id, LEGACY_USER);
    assert_eq!(
        snapshot.latest_message_seq.0,
        MESSAGE_HIGH_WATER.to_string()
    );
    assert_eq!(snapshot.latest_event_seq.0, EVENT_HIGH_WATER.to_string());
    assert_eq!(snapshot.appearance.theme, Theme::Dark);
    assert!(snapshot.appearance.reduce_motion);
    assert_eq!(snapshot.appearance.revision.0, "4");
    let page = messages(&mut database);
    assert_eq!(page.items.len(), 1);
    assert_eq!(page.items[0].id, LEGACY_MESSAGE);
    assert_eq!(page.items[0].sender_snapshot.display_name, "旧昵称");
    assert_eq!(page.items[0].sender_snapshot.avatar_id, None);
    let raw: Value = serde_json::from_str(&legacy_sender_json()).unwrap();
    assert!(raw.get("avatar_id").is_none());
    let profiles = database.get_global_configuration(GENERATION).unwrap();
    assert_eq!(profiles.revision.0, "1");
    assert!(profiles.model_profiles.is_empty());
    assert_eq!(
        database.list_agents(GENERATION).unwrap()[0].agent_id,
        LEGACY_AGENT
    );
    let backups = backup_paths(directory.path());
    assert_eq!(backups.len(), 2);
    assert!(Uuid::parse_str(backups[0].file_stem().unwrap().to_str().unwrap()).is_ok());
    let backup_bytes = fs::read(&backups[0]).unwrap();
    let backup = open_reader(&backups[0]).unwrap();
    assert_legacy(&backup, 1);
    assert_eq!(root_id(&backup), identity);
    assert_eq!(sequence(&backup, "messages"), MESSAGE_HIGH_WATER);
    assert_eq!(sequence(&backup, "domain_events"), EVENT_HIGH_WATER);
    assert!(
        backup
            .execute("UPDATE app_meta SET root_id='must-remain-read-only'", [])
            .is_err()
    );
    drop(backup);
    assert_eq!(fs::read(&backups[0]).unwrap(), backup_bytes);
    let committed = send(&mut database, "post-upgrade-send", "升级后新消息");
    assert_eq!(
        committed.message_seq.0,
        (MESSAGE_HIGH_WATER + 1).to_string()
    );
    assert_eq!(
        sequence(&database.conn, "domain_events"),
        EVENT_HIGH_WATER + 1
    );
    assert!(!directory.path().join("schema-upgrade.json").exists());
    let manifest = read_json(&directory.path().join("data-manifest.json"));
    assert_eq!(
        manifest,
        json!({"format_version":1,"root_id":identity,"schema_version":CURRENT_SCHEMA})
    );
    drop(database);
    let restarted = Database::open(directory.path(), "upgraded-restarted".into()).unwrap();
    assert_legacy(&restarted.conn, CURRENT_SCHEMA);
    assert_eq!(count(&restarted.conn, "messages"), 2);
    assert_eq!(count(&restarted.conn, "agent_config_versions"), 1);
    assert_eq!(backup_paths(directory.path()), backups);
}

#[test]
fn configuration_seed_participates_in_transaction_rollback_and_commit() {
    let directory = legacy_fixture();
    let mut conn = Connection::open(directory.path().join("chat.sqlite3")).unwrap();
    configure_connection(&conn).unwrap();
    conn.execute_batch(MIGRATION_V2).unwrap();
    conn.execute(
        "UPDATE app_meta SET schema_version=2,migration_hash=?1 WHERE singleton=1",
        [migration_hash(2)],
    )
    .unwrap();
    {
        let transaction = conn.transaction().unwrap();
        seed_configuration(&transaction).unwrap();
        assert_eq!(count(&transaction, "global_configuration"), 1);
        assert_eq!(count(&transaction, "agent_config_versions"), 1);
        transaction.rollback().unwrap();
    }
    assert_eq!(count(&conn, "global_configuration"), 0);
    assert_eq!(count(&conn, "agent_configurations"), 0);
    assert_eq!(count(&conn, "agent_config_versions"), 0);
    let transaction = conn.transaction().unwrap();
    seed_configuration(&transaction).unwrap();
    transaction.commit().unwrap();
    assert_eq!(count(&conn, "global_configuration"), 1);
    assert_eq!(count(&conn, "agent_config_versions"), 1);
    assert_legacy(&conn, 2);
}

#[test]
fn committed_schema_two_with_valid_schema_one_manifest_and_journal_recovers_without_reseeding() {
    let directory = legacy_fixture();
    let (_snapshot_id, backup) = prepare_upgrade_journal(&directory);
    let backup_bytes = fs::read(&backup).unwrap();
    commit_v2(&directory);
    let conn = Connection::open(directory.path().join("chat.sqlite3")).unwrap();
    conn.execute("UPDATE global_configuration SET revision=9", [])
        .unwrap();
    let json: String = conn
        .query_row(
            "SELECT configuration_json FROM agent_config_versions WHERE agent_id=?1 AND revision=1",
            [LEGACY_AGENT],
            |row| row.get(0),
        )
        .unwrap();
    let mut committed_agent: AgentConfiguration = serde_json::from_str(&json).unwrap();
    committed_agent.skill = "已经提交的独立配置，恢复不得覆盖".into();
    conn.execute(
        "UPDATE agent_config_versions SET configuration_json=?1 WHERE agent_id=?2 AND revision=1",
        params![
            serde_json::to_string(&committed_agent).unwrap(),
            LEGACY_AGENT
        ],
    )
    .unwrap();
    let identity = root_id(&conn);
    drop(conn);
    let mut recovered = Database::open(directory.path(), "committed-recovery".into()).unwrap();
    assert_legacy(&recovered.conn, CURRENT_SCHEMA);
    assert_eq!(root_id(&recovered.conn), identity);
    assert_eq!(
        recovered
            .get_global_configuration("committed-recovery")
            .unwrap()
            .revision
            .0,
        "9"
    );
    assert_eq!(
        recovered.list_agents("committed-recovery").unwrap(),
        vec![committed_agent.clone()]
    );
    assert_eq!(count(&recovered.conn, "global_configuration"), 1);
    assert_eq!(count(&recovered.conn, "agent_config_versions"), 1);
    assert_eq!(count(&recovered.conn, "domain_events"), 1);
    assert_eq!(sequence(&recovered.conn, "messages"), MESSAGE_HIGH_WATER);
    assert_eq!(sequence(&recovered.conn, "domain_events"), EVENT_HIGH_WATER);
    assert_eq!(
        messages(&mut recovered).items[0].sender_snapshot.avatar_id,
        None
    );
    assert!(!directory.path().join("schema-upgrade.json").exists());
    assert_eq!(
        read_json(&directory.path().join("data-manifest.json"))["schema_version"],
        CURRENT_SCHEMA
    );
    let backups = backup_paths(directory.path());
    assert_eq!(backups.len(), 2);
    assert!(backups.contains(&backup));
    assert_eq!(fs::read(&backup).unwrap(), backup_bytes);
    drop(recovered);
    let restarted = Database::open(directory.path(), "recovery-restarted".into()).unwrap();
    assert_eq!(
        restarted.list_agents("recovery-restarted").unwrap(),
        vec![committed_agent]
    );
    assert_eq!(backup_paths(directory.path()), backups);
}

#[test]
fn schema_one_with_existing_valid_journal_reuses_snapshot_and_completes_upgrade() {
    let directory = legacy_fixture();
    let (_snapshot_id, backup) = prepare_upgrade_journal(&directory);
    let bytes = fs::read(&backup).unwrap();
    let upgraded = Database::open(directory.path(), "precommit-recovery".into()).unwrap();
    assert_legacy(&upgraded.conn, CURRENT_SCHEMA);
    assert_eq!(count(&upgraded.conn, "agent_config_versions"), 1);
    let backups = backup_paths(directory.path());
    assert_eq!(backups.len(), 2);
    assert!(backups.contains(&backup));
    assert_eq!(fs::read(&backup).unwrap(), bytes);
    assert!(!directory.path().join("schema-upgrade.json").exists());
}

#[test]
fn mismatched_manifest_identity_or_schema_is_rejected_without_modifying_original_files() {
    for mismatch in ["root", "schema"] {
        let directory = legacy_fixture();
        let path = directory.path().join("chat.sqlite3");
        let manifest_path = directory.path().join("data-manifest.json");
        let mut manifest = read_json(&manifest_path);
        if mismatch == "root" {
            manifest["root_id"] = value(&Uuid::now_v7().to_string());
        } else {
            manifest["schema_version"] = json!(2);
        }
        write_json(&manifest_path, &manifest);
        let before = fs::read(&path).unwrap();
        let before_manifest = fs::read(&manifest_path).unwrap();
        assert_code(
            Database::open(directory.path(), "reject-manifest".into()),
            ErrorCode::DataRootInvalid,
        );
        assert_eq!(fs::read(&path).unwrap(), before);
        assert_eq!(fs::read(&manifest_path).unwrap(), before_manifest);
        assert!(!directory.path().join("backups").exists());
        assert!(!directory.path().join("schema-upgrade.json").exists());
        assert_legacy(&open_reader(&path).unwrap(), 1);
    }
}

#[test]
fn schema_two_with_schema_one_manifest_without_journal_is_rejected_read_only() {
    let directory = legacy_fixture();
    commit_v2(&directory);
    let path = directory.path().join("chat.sqlite3");
    let manifest = directory.path().join("data-manifest.json");
    let before = fs::read(&path).unwrap();
    let before_manifest = fs::read(&manifest).unwrap();
    assert!(!directory.path().join("schema-upgrade.json").exists());
    assert_code(
        Database::open(directory.path(), "unjustified-version-mismatch".into()),
        ErrorCode::DataRootInvalid,
    );
    assert_eq!(fs::read(&path).unwrap(), before);
    assert_eq!(fs::read(&manifest).unwrap(), before_manifest);
    assert!(!directory.path().join("backups").exists());
    assert_legacy(&open_reader(&path).unwrap(), 2);
}

#[test]
fn invalid_upgrade_journal_cannot_publish_committed_schema_two_or_modify_history() {
    for field in ["root_id", "migration_hash", "from_version", "to_version"] {
        let directory = legacy_fixture();
        let (_snapshot_id, backup) = prepare_upgrade_journal(&directory);
        commit_v2(&directory);
        let journal_path = directory.path().join("schema-upgrade.json");
        let mut journal = read_json(&journal_path);
        journal[field] = match field {
            "root_id" => value(&Uuid::now_v7().to_string()),
            "migration_hash" => json!("incorrect-migration-hash"),
            "from_version" => json!(0),
            _ => json!(3),
        };
        write_json(&journal_path, &journal);
        let path = directory.path().join("chat.sqlite3");
        let manifest = directory.path().join("data-manifest.json");
        let bytes = fs::read(&path).unwrap();
        let manifest_bytes = fs::read(&manifest).unwrap();
        let journal_bytes = fs::read(&journal_path).unwrap();
        let backup_bytes = fs::read(&backup).unwrap();
        assert_code(
            Database::open(directory.path(), "invalid-journal".into()),
            ErrorCode::DataRootInvalid,
        );
        assert_eq!(fs::read(&path).unwrap(), bytes);
        assert_eq!(fs::read(&manifest).unwrap(), manifest_bytes);
        assert_eq!(fs::read(&journal_path).unwrap(), journal_bytes);
        assert_eq!(fs::read(&backup).unwrap(), backup_bytes);
        assert_legacy(&open_reader(&path).unwrap(), 2);
    }
}

#[test]
fn regular_file_blocking_backups_prevents_upgrade_and_preserves_schema_one_history() {
    let directory = legacy_fixture();
    let obstacle = directory.path().join("backups");
    let bytes = b"only this TempDir test owns this regular-file obstacle";
    fs::write(&obstacle, bytes).unwrap();
    let manifest = directory.path().join("data-manifest.json");
    let manifest_before = fs::read(&manifest).unwrap();
    assert_code(
        Database::open(directory.path(), "blocked-upgrade".into()),
        ErrorCode::IoError,
    );
    let reader = open_reader(&directory.path().join("chat.sqlite3")).unwrap();
    assert_legacy(&reader, 1);
    assert_eq!(sequence(&reader, "messages"), MESSAGE_HIGH_WATER);
    assert_eq!(sequence(&reader, "domain_events"), EVENT_HIGH_WATER);
    assert_eq!(
        reader
            .query_row(
                "SELECT COUNT(*) FROM sqlite_schema WHERE name='global_configuration'",
                [],
                |row| row.get::<_, i64>(0)
            )
            .unwrap(),
        0
    );
    assert_eq!(fs::read(&obstacle).unwrap(), bytes);
    assert_eq!(fs::read(&manifest).unwrap(), manifest_before);
    assert!(!directory.path().join("schema-upgrade.json").exists());
    drop(reader);
    fs::remove_file(&obstacle).unwrap();
    let retried = Database::open(directory.path(), "unblocked-upgrade".into()).unwrap();
    assert_legacy(&retried.conn, CURRENT_SCHEMA);
    assert_eq!(backup_paths(directory.path()).len(), 2);
}

#[test]
fn runtime_migration_preserves_previous_hashes_and_initializes_all_tables() {
    assert_eq!(migration_hash(1), fingerprint(MIGRATION.as_bytes()));
    assert_eq!(
        migration_hash(2),
        fingerprint(format!("{}\n{MIGRATION_V2}", fingerprint(MIGRATION.as_bytes())).as_bytes())
    );
    assert_eq!(
        migration_hash(3),
        fingerprint(format!("{}\n{MIGRATION_V3}", migration_hash(2)).as_bytes())
    );
    let (_directory, database) = database();
    verify_database(&database.conn).unwrap();
    assert_eq!(schema_version(&database.conn), CURRENT_SCHEMA);
    for table in [
        "agent_runtime",
        "runtime_plans",
        "runtime_requests",
        "runtime_wakes",
        "runtime_message_commits",
    ] {
        assert_eq!(count(&database.conn, table), 0);
    }
}

#[test]
fn schema_two_upgrade_preserves_configuration_history_and_verified_backup() {
    let directory = schema_two_fixture();
    let conn = Connection::open(directory.path().join("chat.sqlite3")).unwrap();
    conn.execute("UPDATE global_configuration SET revision=9", [])
        .unwrap();
    let configuration: String = conn
        .query_row(
            "SELECT configuration_json FROM agent_config_versions WHERE agent_id=?1 AND revision=1",
            [LEGACY_AGENT],
            |row| row.get(0),
        )
        .unwrap();
    let identity = root_id(&conn);
    drop(conn);
    let database = Database::open(directory.path(), GENERATION.into()).unwrap();
    assert_legacy(&database.conn, CURRENT_SCHEMA);
    assert_eq!(root_id(&database.conn), identity);
    assert_eq!(
        database
            .get_global_configuration(GENERATION)
            .unwrap()
            .revision
            .0,
        "9"
    );
    let preserved: String = database
        .conn
        .query_row(
            "SELECT configuration_json FROM agent_config_versions WHERE agent_id=?1 AND revision=1",
            [LEGACY_AGENT],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(preserved, configuration);
    assert_eq!(sequence(&database.conn, "messages"), MESSAGE_HIGH_WATER);
    assert_eq!(sequence(&database.conn, "domain_events"), EVENT_HIGH_WATER);
    let backups = backup_paths(directory.path());
    assert_eq!(backups.len(), 1);
    let backup = open_reader(&backups[0]).unwrap();
    assert_legacy(&backup, 2);
    assert_eq!(root_id(&backup), identity);
    assert_eq!(count(&backup, "agent_config_versions"), 1);
    drop(backup);
    assert!(!directory.path().join("schema-upgrade.json").exists());
    drop(database);
    let restarted = Database::open(directory.path(), "schema-three-restarted".into()).unwrap();
    assert_legacy(&restarted.conn, CURRENT_SCHEMA);
    assert_eq!(backup_paths(directory.path()), backups);
}

#[test]
fn schema_two_with_existing_valid_journal_reuses_snapshot_and_completes_upgrade() {
    let directory = schema_two_fixture();
    let (_, backup) = prepare_versioned_upgrade_journal(&directory, 2);
    let bytes = fs::read(&backup).unwrap();
    let upgraded = Database::open(directory.path(), GENERATION.into()).unwrap();
    assert_legacy(&upgraded.conn, CURRENT_SCHEMA);
    assert_eq!(count(&upgraded.conn, "agent_config_versions"), 1);
    assert_eq!(backup_paths(directory.path()), vec![backup.clone()]);
    assert_eq!(fs::read(&backup).unwrap(), bytes);
    assert!(!directory.path().join("schema-upgrade.json").exists());
}

#[test]
fn committed_schema_three_recovers_manifest_without_reseeding_runtime_or_configuration() {
    let directory = schema_two_fixture();
    let (_, backup) = prepare_versioned_upgrade_journal(&directory, 2);
    let backup_bytes = fs::read(&backup).unwrap();
    commit_v3(&directory);
    let conn = Connection::open(directory.path().join("chat.sqlite3")).unwrap();
    configure_connection(&conn).unwrap();
    conn.execute("UPDATE global_configuration SET revision=9", [])
        .unwrap();
    let runtime = AgentRuntimeState {
        agent_id: LEGACY_AGENT.into(),
        config_revision: 1.into(),
        status: AgentRuntimeStatus::Paused,
        detail: None,
        next_wake_at: None,
        requests_today: 1,
    };
    let state_json = serde_json::to_string(&runtime).unwrap();
    conn.execute(
        "INSERT INTO agent_runtime VALUES (?1,1,?2,1)",
        params![LEGACY_AGENT, state_json],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO runtime_plans VALUES (?1,1,123456,'persisted-chain')",
        [LEGACY_AGENT],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO runtime_requests(requester_id,occurred_at) VALUES (?1,1000)",
        [LEGACY_AGENT],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO runtime_wakes(agent_id,occurred_at) VALUES (?1,1000)",
        [LEGACY_AGENT],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO runtime_message_commits VALUES ('persisted-decision',0,?1,1,17,'persisted-chain','payload-hash',17,?2)",
        params![LEGACY_AGENT, LEGACY_EVENT_SEQUENCE],
    ).unwrap();
    drop(conn);
    let recovered = Database::open(directory.path(), GENERATION.into()).unwrap();
    assert_legacy(&recovered.conn, CURRENT_SCHEMA);
    assert_eq!(
        recovered
            .get_global_configuration(GENERATION)
            .unwrap()
            .revision
            .0,
        "9"
    );
    let persisted: (String, bool) = recovered
        .conn
        .query_row(
            "SELECT state_json,paused FROM agent_runtime WHERE agent_id=?1",
            [LEGACY_AGENT],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap();
    assert_eq!(persisted, (state_json, true));
    for table in [
        "runtime_plans",
        "runtime_requests",
        "runtime_wakes",
        "runtime_message_commits",
    ] {
        assert_eq!(count(&recovered.conn, table), 1);
    }
    assert_eq!(count(&recovered.conn, "agent_config_versions"), 1);
    assert_eq!(backup_paths(directory.path()), vec![backup.clone()]);
    assert_eq!(fs::read(&backup).unwrap(), backup_bytes);
    assert!(!directory.path().join("schema-upgrade.json").exists());
    assert_eq!(
        read_json(&directory.path().join("data-manifest.json"))["schema_version"],
        CURRENT_SCHEMA,
    );
}

#[test]
fn invalid_runtime_upgrade_journals_preserve_schema_two_and_committed_schema_three() {
    for committed in [false, true] {
        for field in [
            "root_id",
            "migration_hash",
            "from_version",
            "to_version",
            "snapshot_id",
        ] {
            let directory = schema_two_fixture();
            let (_, backup) = prepare_versioned_upgrade_journal(&directory, 2);
            if committed {
                commit_v3(&directory);
            }
            let journal_path = directory.path().join("schema-upgrade.json");
            let mut journal = read_json(&journal_path);
            journal[field] = match field {
                "root_id" => value(&Uuid::now_v7().to_string()),
                "migration_hash" => json!("incorrect-migration-hash"),
                "from_version" => json!(1),
                "to_version" => json!(CURRENT_SCHEMA + 1),
                _ => json!("invalid-snapshot-id"),
            };
            write_json(&journal_path, &journal);
            let path = directory.path().join("chat.sqlite3");
            let manifest = directory.path().join("data-manifest.json");
            let bytes = fs::read(&path).unwrap();
            let manifest_bytes = fs::read(&manifest).unwrap();
            let journal_bytes = fs::read(&journal_path).unwrap();
            let backup_bytes = fs::read(&backup).unwrap();
            assert_code(
                Database::open(directory.path(), GENERATION.into()),
                ErrorCode::DataRootInvalid,
            );
            assert_eq!(fs::read(&path).unwrap(), bytes);
            assert_eq!(fs::read(&manifest).unwrap(), manifest_bytes);
            assert_eq!(fs::read(&journal_path).unwrap(), journal_bytes);
            assert_eq!(fs::read(&backup).unwrap(), backup_bytes);
            assert_legacy(&open_reader(&path).unwrap(), if committed { 3 } else { 2 });
        }
    }
}

#[test]
fn schema_three_with_schema_two_manifest_without_journal_is_rejected_read_only() {
    let directory = schema_two_fixture();
    commit_v3(&directory);
    let path = directory.path().join("chat.sqlite3");
    let manifest = directory.path().join("data-manifest.json");
    let bytes = fs::read(&path).unwrap();
    let manifest_bytes = fs::read(&manifest).unwrap();
    assert_code(
        Database::open(directory.path(), GENERATION.into()),
        ErrorCode::DataRootInvalid,
    );
    assert_eq!(fs::read(&path).unwrap(), bytes);
    assert_eq!(fs::read(&manifest).unwrap(), manifest_bytes);
    assert!(!directory.path().join("backups").exists());
    assert_legacy(&open_reader(&path).unwrap(), 3);
}
