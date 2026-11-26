use std::{fs, path::Path};

use rusqlite::{Connection, params};
use serde::Serialize;
use serde_json::{Value, json};
use tempfile::TempDir;
use uuid::Uuid;

use crate::domain::{contracts::*, error::AppResult};
use crate::storage::configuration::WindowState;

use super::{
    backup::backup_database,
    configuration::seed_configuration,
    database::{
        CURRENT_SCHEMA, Database, SCHEMA, configure_connection, fingerprint, open_reader,
        verify_database,
    },
};

const GENERATION: &str = "configuration-tests";

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
    }
}

fn install_presets(database: &mut Database) -> GlobalConfiguration {
    let current = database
        .get_global_configuration(&database.generation_id)
        .unwrap();
    let mut request = global_request(database, "install-presets", &current);
    request.model_profiles = vec![model_profile()];
    request.persona_presets[0].language_style = "原始人格语言风格".into();
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

#[test]
fn latest_schema_initializes_current_metadata_and_runtime_tables_once() {
    let (directory, database) = database();
    verify_database(&database.conn).unwrap();
    assert_eq!(schema_version(&database.conn), CURRENT_SCHEMA);
    let (version, hash): (u32, String) = database
        .conn
        .query_row(
            "SELECT schema_version,schema_hash FROM app_meta WHERE singleton=1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap();
    assert_eq!(version, CURRENT_SCHEMA);
    assert_eq!(hash, fingerprint(SCHEMA.as_bytes()));
    let manifest = read_json(&directory.path().join("data-manifest.json"));
    assert_eq!(
        manifest,
        json!({"format_version":1,"root_id":root_id(&database.conn),"schema_version":CURRENT_SCHEMA})
    );
    let expected_agents = super::configuration::default_agent_specs().len() as i64;
    assert_eq!(count(&database.conn, "agent_runtime_states"), expected_agents);
    assert_eq!(count(&database.conn, "agent_config_versions"), expected_agents);
    for table in [
        "runtime_plans",
        "runtime_request_counts",
        "runtime_wake_log",
        "runtime_messages",
        "runtime_message_activity",
    ] {
        assert_eq!(count(&database.conn, table), 0);
    }
    assert!(!directory.path().join("backups").exists());
}

#[test]
fn configuration_seed_participates_in_latest_schema_transaction_rollback_and_commit() {
    let mut conn = Connection::open_in_memory().unwrap();
    configure_connection(&conn).unwrap();
    conn.execute_batch(SCHEMA).unwrap();
    conn.execute("INSERT INTO participants(id,kind,display_name,status,builtin_key,created_at) VALUES ('seed-agent','agent','小墨','needs_configuration','xiaomo',1000)", []).unwrap();
    {
        let transaction = conn.transaction().unwrap();
        seed_configuration(&transaction).unwrap();
        assert_eq!(count(&transaction, "global_configuration"), 1);
        assert_eq!(count(&transaction, "agent_config_versions"), 1);
        transaction.rollback().unwrap();
    }
    for table in [
        "global_configuration",
        "persona_presets",
        "agent_configurations",
        "agent_config_versions",
    ] {
        assert_eq!(count(&conn, table), 0);
    }
    let transaction = conn.transaction().unwrap();
    seed_configuration(&transaction).unwrap();
    transaction.commit().unwrap();
    for table in [
        "global_configuration",
        "persona_presets",
        "agent_configurations",
        "agent_config_versions",
    ] {
        assert_eq!(count(&conn, table), 1);
    }
}

#[test]
fn current_schema_manifest_identity_version_and_format_mismatch_preserve_original_files() {
    for field in ["root_id", "schema_version", "format_version"] {
        let (directory, database) = database();
        database
            .conn
            .pragma_update(None, "journal_mode", "DELETE")
            .unwrap();
        drop(database);
        let path = directory.path().join("chat.sqlite3");
        let manifest_path = directory.path().join("data-manifest.json");
        let mut manifest = read_json(&manifest_path);
        manifest[field] = if field == "root_id" {
            json!(Uuid::now_v7().to_string())
        } else {
            json!(0)
        };
        write_json(&manifest_path, &manifest);
        let bytes = fs::read(&path).unwrap();
        let manifest_bytes = fs::read(&manifest_path).unwrap();
        assert_code(
            Database::open(directory.path(), "invalid-current-manifest".into()),
            ErrorCode::DataRootInvalid,
        );
        assert_eq!(fs::read(&path).unwrap(), bytes);
        assert_eq!(fs::read(&manifest_path).unwrap(), manifest_bytes);
        assert!(!directory.path().join("backups").exists());
    }
}

#[test]
fn current_schema_online_backup_preserves_configuration_and_model_history() {
    let (directory, mut database) = database();
    let global = install_presets(&mut database);
    let agent = agent_with_snapshot(&database, &global);
    let revision = agent.revision.clone();
    let agent = save_agent(
        &mut database,
        "backup-configure-agent",
        agent,
        Some(revision),
    );
    let mut request = global_request(&database, "backup-global-update", &global);
    request.model_profiles[0].name = "最新模型预设".into();
    database.save_global_configuration(request).unwrap();
    send(&mut database, "backup-history", "当前结构的消息记录");
    let backup_path = directory.path().join("current-backup.sqlite3");
    backup_database(&database.conn, &backup_path).unwrap();
    let backup = open_reader(&backup_path).unwrap();
    verify_database(&backup).unwrap();
    assert_eq!(root_id(&backup), root_id(&database.conn));
    for table in [
        "participants",
        "messages",
        "domain_events",
        "agent_config_versions",
        "model_profile_versions",
        "runtime_message_activity",
    ] {
        assert_eq!(count(&backup, table), count(&database.conn, table));
    }
    let saved: String = backup.query_row("SELECT configuration_json FROM agent_config_versions WHERE agent_id=?1 AND revision=?2", params![agent.agent_id, 2], |row| row.get(0)).unwrap();
    assert_eq!(
        serde_json::from_str::<AgentConfiguration>(&saved).unwrap(),
        agent
    );
    assert_eq!(count(&backup, "model_profile_versions"), 2);
    let bytes = fs::read(&backup_path).unwrap();
    drop(backup);
    drop(database);
    let reopened = Database::open(directory.path(), "current-backup-reopen".into()).unwrap();
    assert_eq!(
        reopened.list_agents("current-backup-reopen").unwrap()[0],
        agent
    );
    assert_eq!(fs::read(&backup_path).unwrap(), bytes);
}

#[test]
fn current_schema_reopen_preserves_idle_sleep_pause_protection_and_wake_plans() {
    for status in [
        "observing",
        "sleeping",
        "paused",
        "protected",
        "deciding",
        "waiting_to_send",
    ] {
        let (directory, database) = database();
        let agent = database.list_agents(GENERATION).unwrap().remove(0);
        let next = (status != "observing").then(|| crate::domain::error::now_ms() + 60_000);
        database.conn.execute("UPDATE agent_runtime_states SET status=?1,detail='persisted state',next_wake_at=?2 WHERE agent_id=?3", params![status, next, agent.agent_id]).unwrap();
        if let Some(next) = next {
            database
                .conn
                .execute(
                    "INSERT INTO runtime_plans VALUES (?1,1,?2,'persisted-chain')",
                    params![agent.agent_id, next],
                )
                .unwrap();
        }
        let day = crate::domain::error::now_ms().div_euclid(86_400_000);
        database
            .conn
            .execute(
                "INSERT INTO runtime_request_counts VALUES (?1,?2,7)",
                params![agent.agent_id, day],
            )
            .unwrap();
        drop(database);
        let reopened = Database::open(directory.path(), "persisted-state-reopen".into()).unwrap();
        let actual: (String, Option<String>, Option<i64>) = reopened
            .conn
            .query_row(
                "SELECT status,detail,next_wake_at FROM agent_runtime_states WHERE agent_id=?1",
                [&agent.agent_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        let interrupted = matches!(status, "deciding" | "waiting_to_send");
        assert_eq!(
            actual,
            (
                if interrupted { "offline" } else { status }.into(),
                (!interrupted).then(|| "persisted state".into()),
                next
            )
        );
        assert_eq!(
            count(&reopened.conn, "runtime_plans"),
            i64::from(next.is_some())
        );
        if let Some(next) = next {
            let plan: (i64, i64, String) = reopened.conn.query_row("SELECT config_revision,next_wake_at,chain_id FROM runtime_plans WHERE agent_id=?1", [&agent.agent_id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?))).unwrap();
            assert_eq!(plan, (1, next, "persisted-chain".into()));
        }
        let requests: i64 = reopened
            .conn
            .query_row(
                "SELECT requests FROM runtime_request_counts WHERE requester_id=?1 AND utc_day=?2",
                params![agent.agent_id, day],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(requests, 7);
        assert_eq!(count(&reopened.conn, "domain_events"), 0);
        assert_eq!(
            reopened.list_agents("persisted-state-reopen").unwrap()[0],
            agent
        );
    }
}

#[test]
fn new_database_seeds_two_default_agents_with_eight_dimensions_and_general_activity_default() {
    let (_directory, database) = database();
    let specs = super::configuration::default_agent_specs();
    let agents = database.list_agents(GENERATION).unwrap();
    assert_eq!(agents.len(), specs.len());
    let names: Vec<_> = agents.iter().map(|agent| agent.display_name.clone()).collect();
    for spec in &specs {
        assert!(names.contains(&spec.display_name));
    }
    let agent = agents.into_iter().find(|agent| agent.display_name == specs[1].display_name).unwrap();
    assert_eq!(agent.dimensions, specs[1].dimensions);
    assert_eq!(agent.gender_description, Some(specs[1].gender_description.clone()));
    assert_eq!(agent.language_style, specs[1].language_style);
    assert!(agent.skill.is_empty(), "通用角色指令不写入用户可编辑的 skill");
    let dimensions = value(&agent.dimensions);
    let dimensions = dimensions.as_object().unwrap();
    assert_eq!(dimensions.len(), 8);
    assert_eq!(super::configuration::default_dimensions().activity, 50);
    let global = database.get_global_configuration(GENERATION).unwrap();
    assert!(
        global
            .persona_presets
            .iter()
            .all(|preset| preset.dimensions.activity == 50)
    );
}

#[test]
fn activity_accepts_zero_and_one_hundred_and_rejects_values_above_one_hundred() {
    let (_directory, mut database) = database();
    let mut agent = database.list_agents(GENERATION).unwrap().remove(0);
    for activity in [0, 100] {
        agent.dimensions.activity = activity;
        let revision = agent.revision.clone();
        agent = save_agent(
            &mut database,
            &format!("agent-activity-{activity}"),
            agent,
            Some(revision),
        );
        assert_eq!(agent.dimensions.activity, activity);
    }
    let mut invalid = agent.clone();
    invalid.dimensions.activity = 101;
    assert_code(
        database.save_agent(AgentSaveRequest {
            data_generation_id: GENERATION.into(),
            client_request_id: "agent-activity-invalid".into(),
            expected_revision: Some(agent.revision.clone()),
            configuration: invalid,
        }),
        ErrorCode::InvalidInput,
    );
    assert_eq!(database.list_agents(GENERATION).unwrap()[0], agent);

    let mut global = database.get_global_configuration(GENERATION).unwrap();
    for activity in [0, 100] {
        let mut request =
            global_request(&database, &format!("preset-activity-{activity}"), &global);
        request.persona_presets[0].dimensions.activity = activity;
        global = database.save_global_configuration(request).unwrap().0;
        assert_eq!(global.persona_presets[0].dimensions.activity, activity);
    }
    let mut invalid = global_request(&database, "preset-activity-invalid", &global);
    invalid.persona_presets[0].dimensions.activity = 101;
    assert_code(
        database.save_global_configuration(invalid),
        ErrorCode::InvalidInput,
    );
    assert_eq!(
        value(&database.get_global_configuration(GENERATION).unwrap()),
        value(&global)
    );
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
            1 => profile.base_url = "ftp://invalid".into(),
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
    edited.skill = "副本独立技能".into();
    edited.dimensions.humor = 90;
    edited.model.as_mut().unwrap().profile.model_name = "copy-specific-model".into();
    let copy = save_agent(&mut database, "edit-copy", edited, Some(copy.revision));
    let mut update = global_request(&database, "edit-global-after-copy", &global);
    update.model_profiles[0].model_name = "new-global-model".into();
    update.model_profiles[0].base_url = "https://new-global.example.invalid/v1".into();
    update.persona_presets[0].language_style = "新的全局人格风格".into();
    update.persona_presets[0].skill = "新的全局人格技能".into();
    update.persona_presets[0].dimensions.humor = 5;
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
        assert_eq!(count(&database.conn, "participants"), 1 + super::configuration::default_agent_specs().len() as i64);
        assert_eq!(
            count(&database.conn, "agent_config_versions"),
            versions_before
        );
        assert_eq!(count(&database.conn, "domain_events"), events_before);
        assert_eq!(count(&database.conn, "request_records"), requests_before);
    }
    assert_eq!(database.list_agents(GENERATION).unwrap().len(), super::configuration::default_agent_specs().len());
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
    let listed = database.list_agents(GENERATION).unwrap();
    assert!(listed.contains(&saved));
    assert_eq!(listed.len(), super::configuration::default_agent_specs().len());
    assert_eq!(count(&database.conn, "agent_config_versions"), super::configuration::default_agent_specs().len() as i64 + 1);
    assert_eq!(count(&database.conn, "domain_events"), 1);
    assert_eq!(count(&database.conn, "request_records"), 1);
}

#[test]
fn user_profile_rename_updates_historical_sender_and_survives_restart() {
    let (directory, mut database) = database();
    let before_profile = database.get_user_profile(GENERATION).unwrap();
    let before_message = send(&mut database, "message-before-rename", "改名前的消息");
    let request = UserProfileSaveRequest {
        data_generation_id: GENERATION.into(),
        client_request_id: "rename-user".into(),
        expected_revision: before_profile.revision.clone(),
        display_name: "改名后的用户".into(),
        avatar_id: None,
        bio: "喜欢安静的地方。".into(),
    };
    let (saved, event) = database.save_user_profile(request.clone()).unwrap();
    assert!(
        matches!(event.unwrap().payload, EventPayload::ParticipantProfileChanged { participant } if participant.id == before_profile.participant_id && participant.display_name == saved.display_name)
    );
    let (replayed, duplicate) = database.save_user_profile(request).unwrap();
    assert_eq!(value(&replayed), value(&saved));
    assert!(duplicate.is_none());
    assert_eq!(saved.bio, "喜欢安静的地方。");
    assert_eq!(database.get_user_profile(GENERATION).unwrap().bio, saved.bio);
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
    assert_eq!(old.sender_id, saved.participant_id);
    assert_eq!(old.sender_id, new.sender_id);
    let participant = super::chat::participants(&database.conn)
        .unwrap()
        .into_iter()
        .find(|participant| participant.id == old.sender_id)
        .unwrap();
    assert_eq!(participant.display_name, saved.display_name);
    assert_eq!(participant.avatar_id, saved.avatar_id);
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
            .sender_id,
        saved.participant_id
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


#[test]
fn delete_agent_removes_configuration_but_keeps_chat_history() {
    let (_directory, mut database) = database();
    let global = install_presets(&mut database);
    let agent = agent_with_snapshot(&database, &global);
    let revision = agent.revision.clone();
    let saved = save_agent(&mut database, "delete-agent-save", agent, Some(revision));
    let id = saved.agent_id.clone();

    database
        .delete_agent(AgentDeleteRequest {
            data_generation_id: database.generation_id.clone(),
            agent_id: id.clone(),
        })
        .unwrap();

    assert!(database.list_agents(&database.generation_id).unwrap().iter().all(|item| item.agent_id != id));
    assert_eq!(
        database.conn.query_row("SELECT COUNT(*) FROM agent_config_versions WHERE agent_id=?1", [&id], |row| row.get::<_, i64>(0)).unwrap(),
        0
    );
    assert_eq!(
        database
            .conn
            .query_row("SELECT COUNT(*) FROM participants WHERE id=?1", [&id], |row| row.get::<_, i64>(0))
            .unwrap(),
        0
    );
    // 重复删除应报错，不产生副作用
    assert!(database
        .delete_agent(AgentDeleteRequest {
            data_generation_id: database.generation_id.clone(),
            agent_id: id,
        })
        .is_err());
}

#[test]
fn news_configuration_round_trips_and_rejects_stale_revisions() {
    let (_dir, mut database) = database();
    let first = database.get_news_configuration(GENERATION).unwrap();
    assert!(first.configuration.enabled);
    assert_eq!(first.configuration.provider, NewsProvider::Auto);
    assert!(first.configuration.proxy_url.is_empty());
    assert_eq!(first.revision.0, "0");

    let mut configuration = first.configuration.clone();
    configuration.provider = NewsProvider::FreeNewsTrending;
    configuration.refresh_minutes = 45;
    configuration.max_items = 5;
    let saved = database
        .save_news_configuration(NewsConfigurationSaveRequest {
            data_generation_id: GENERATION.into(),
            client_request_id: "news-save-1".into(),
            expected_revision: first.revision.clone(),
            configuration: configuration.clone(),
        })
        .unwrap();
    assert_eq!(saved.revision.0, "1");
    assert_eq!(database.get_news_configuration(GENERATION).unwrap(), saved);

    // 旧 revision 不能覆盖新配置
    assert_code(
        database.save_news_configuration(NewsConfigurationSaveRequest {
            data_generation_id: GENERATION.into(),
            client_request_id: "news-save-2".into(),
            expected_revision: first.revision,
            configuration,
        }),
        ErrorCode::ConfigConflict,
    );

    // 超出边界的刷新间隔被拒绝
    let mut invalid = saved.configuration.clone();
    invalid.refresh_minutes = 1;
    assert!(database
        .save_news_configuration(NewsConfigurationSaveRequest {
            data_generation_id: GENERATION.into(),
            client_request_id: "news-save-3".into(),
            expected_revision: saved.revision.clone(),
            configuration: invalid,
        })
        .is_err());
    assert_eq!(database.get_news_configuration(GENERATION).unwrap(), saved);
}

fn append_agent_message(database: &Database, room_id: &str, sender_id: &str, text: &str) -> i64 {
    let id = Uuid::now_v7().to_string();
    database
        .conn
        .execute(
            "INSERT INTO messages (id, room_id, sender_id, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, room_id, sender_id, 1_700_000_000_000_i64],
        )
        .unwrap();
    let seq = database.conn.last_insert_rowid();
    database
        .conn
        .execute(
            "INSERT INTO message_parts(message_id,ordinal,kind,text) VALUES (?1, 0, 'text', ?2)",
            params![id, text],
        )
        .unwrap();
    seq
}

#[test]
fn inbox_initializes_as_read_and_tracks_unread_mute() {
    let (_dir, mut database) = database();
    let initial = database.get_inbox(GENERATION).unwrap();
    assert_eq!(initial.conversations.len(), 1);
    assert_eq!(initial.unread_total, 0);
    let conversation = initial.conversations[0].clone();
    // 首次读取把已有历史视为已读，避免新装即出现大量未读。
    assert_eq!(conversation.last_read_seq.0, conversation.latest_seq.0);
    assert_eq!(conversation.latest_preview, "暂无消息");

    let agent: String = database
        .conn
        .query_row(
            "SELECT id FROM participants WHERE kind = 'agent' LIMIT 1",
            [],
            |row| row.get(0),
        )
        .unwrap();
    let room: String = database
        .conn
        .query_row("SELECT id FROM room WHERE singleton = 1", [], |row| row.get(0))
        .unwrap();

    let first = append_agent_message(&database, &room, &agent, "第一条消息");
    let unread = database.get_inbox(GENERATION).unwrap();
    assert_eq!(unread.conversations[0].unread_count, 1);
    assert_eq!(unread.unread_total, 1);
    assert_eq!(unread.conversations[0].latest_preview, "第一条消息");
    assert_eq!(
        unread.conversations[0].first_unread_seq.as_ref().unwrap().0,
        first.to_string()
    );
    assert!(unread.conversations[0].latest_sender.is_some());

    let read = database
        .mark_inbox_read(InboxMarkReadRequest {
            data_generation_id: GENERATION.into(),
            client_request_id: "inbox-read-1".into(),
            conversation_id: conversation.id.clone(),
            through_seq: first.into(),
        })
        .unwrap();
    assert_eq!(read.unread_total, 0);
    assert!(read.conversations[0].first_unread_id.is_none());

    // 已读位置只前进不回退
    let stale = database
        .mark_inbox_read(InboxMarkReadRequest {
            data_generation_id: GENERATION.into(),
            client_request_id: "inbox-read-2".into(),
            conversation_id: conversation.id.clone(),
            through_seq: 0.into(),
        })
        .unwrap();
    assert_eq!(stale.conversations[0].last_read_seq.0, first.to_string());

    let muted = database
        .set_inbox_muted(InboxMuteRequest {
            data_generation_id: GENERATION.into(),
            client_request_id: "inbox-mute-1".into(),
            conversation_id: conversation.id.clone(),
            muted: true,
        })
        .unwrap();
    assert!(muted.conversations[0].muted);

    append_agent_message(&database, &room, &agent, "第二条消息");
    let after = database.get_inbox(GENERATION).unwrap();
    // 免打扰仍记录自身未读数，但不汇总到全局角标。
    assert_eq!(after.conversations[0].unread_count, 1);
    assert_eq!(after.unread_total, 0);
}

#[test]
fn old_news_keywords_are_ignored_without_losing_other_settings() {
    let (_dir, mut database) = database();
    let legacy = serde_json::json!({"news":{"revision":"4","configuration":{"enabled":true,"provider":"google_news_rss","query":"用户旧关键词","refresh_minutes":45,"max_items":5}}});
    database.conn.execute("UPDATE global_configuration SET preferences_json = ?1 WHERE singleton = 1", [legacy.to_string()]).unwrap();
    let state = database.get_news_configuration(GENERATION).unwrap();
    assert_eq!(state.revision.0, "4");
    assert_eq!(state.configuration.refresh_minutes, 45);
    assert!(serde_json::to_value(&state).unwrap()["configuration"].get("query").is_none());
    let saved = database.save_news_configuration(NewsConfigurationSaveRequest {
        data_generation_id: GENERATION.into(), client_request_id: "news-migrate".into(), expected_revision: state.revision, configuration: state.configuration,
    }).unwrap();
    assert_eq!(saved.revision.0, "5");
    let json: String = database.conn.query_row("SELECT preferences_json FROM global_configuration WHERE singleton = 1", [], |row| row.get(0)).unwrap();
    assert!(!json.contains("用户旧关键词"));
}

#[test]
fn inbox_preferences_do_not_disturb_news_configuration() {
    let (_dir, mut database) = database();
    let news = database.get_news_configuration(GENERATION).unwrap();
    let mut configuration = news.configuration.clone();
    configuration.max_items = 5;
    let saved = database
        .save_news_configuration(NewsConfigurationSaveRequest {
            data_generation_id: GENERATION.into(),
            client_request_id: "news-keep-1".into(),
            expected_revision: news.revision,
            configuration,
        })
        .unwrap();
    let _ = database.get_inbox(GENERATION).unwrap();
    assert_eq!(database.get_news_configuration(GENERATION).unwrap(), saved);
}


#[test]
fn window_state_round_trips_in_preferences() {
    let (_directory, mut database) = database();
    assert!(database.get_window_state(GENERATION).unwrap().is_none());
    let state = WindowState {
        x: 120.5,
        y: 80.0,
        width: 1180.0,
        height: 860.0,
        maximized: false,
    };
    database.save_window_state(GENERATION, &state).unwrap();
    assert_eq!(database.get_window_state(GENERATION).unwrap(), Some(state));

    // 不覆盖其他偏好键
    let json: String = database.conn.query_row(
        "SELECT preferences_json FROM global_configuration WHERE singleton = 1",
        [],
        |row| row.get(0),
    ).unwrap();
    let value: serde_json::Value = serde_json::from_str(&json).unwrap();
    assert!(value.get("window").is_some());
}
