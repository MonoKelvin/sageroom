use std::{
    fs,
    future::Future,
    pin::pin,
    sync::{
        Arc,
        atomic::{AtomicBool, AtomicUsize, Ordering},
        mpsc,
    },
    task::{Context, Poll, Waker},
    time::{Duration, Instant},
};

use rusqlite::{Connection, params};
use serde::Deserialize;
use serde_json::{Value, json};
use tempfile::TempDir;

use crate::domain::{
    contracts::*,
    error::{AppResult, parse_counter},
};

use super::{
    backup::backup_database,
    chat::allocated_seq,
    database::{CURRENT_SCHEMA, Database, configure_connection, open_reader, verify_database},
    search::search_database,
    worker::DbWorker,
};

fn database() -> (TempDir, Database) {
    let directory = TempDir::new().unwrap();
    let database = Database::open(directory.path(), "generation-test".into()).unwrap();
    (directory, database)
}

fn snapshot(database: &mut Database) -> AppSnapshot {
    database
        .snapshot(AppSnapshotRequest {
            data_generation_id: None,
            last_event_seq: None,
        })
        .unwrap()
}

fn room_request(database: &Database, name: &str) -> RoomSaveRequest {
    RoomSaveRequest {
        data_generation_id: database.generation_id.clone(),
        client_request_id: uuid::Uuid::now_v7().to_string(),
        expected_version: 1.into(),
        name: name.into(),
    }
}

fn send_request(generation: &str, id: &str, text: &str) -> ChatSendRequest {
    ChatSendRequest {
        data_generation_id: generation.into(),
        client_request_id: id.into(),
        parts: vec![MessagePart::Text { text: text.into() }],
        quote_message_id: None,
        mention_ids: Vec::new(),
        mention_all: false,
    }
}

fn send(database: &mut Database, id: &str, text: &str) -> ChatSendResult {
    database
        .send_message(send_request(&database.generation_id, id, text))
        .unwrap()
        .0
}

fn list_request(generation: &str, limit: u32) -> ChatListRequest {
    ChatListRequest {
        data_generation_id: generation.into(),
        before_seq: None,
        after_seq: None,
        around_seq: None,
        limit,
    }
}

fn list(database: &mut Database, limit: u32) -> MessagePage {
    database
        .list_messages(list_request(&database.generation_id, limit))
        .unwrap()
}

fn search_request(generation: &str, id: &str, query: &str) -> ChatSearchRequest {
    ChatSearchRequest {
        data_generation_id: generation.into(),
        search_id: id.into(),
        query: query.into(),
        cursor: None,
        limit: 200,
    }
}

fn count(conn: &Connection, table: &str) -> i64 {
    conn.query_row(&format!("SELECT count(*) FROM {table}"), [], |row| {
        row.get(0)
    })
    .unwrap()
}

fn assert_code<T>(result: AppResult<T>, expected: ErrorCode) {
    match result {
        Err(error) => assert_eq!(error.code, expected, "{}", error.message),
        Ok(_) => panic!("操作意外成功，应返回 {expected:?}"),
    }
}

fn assert_no_chat_rows(conn: &Connection) {
    for table in [
        "messages",
        "message_parts",
        "mentions",
        "search_text",
        "domain_events",
        "request_records",
    ] {
        assert_eq!(count(conn, table), 0, "{table} 不应保留失败写入");
    }
}

fn populate_corpus(database: &mut Database, size: i64) {
    let room = database.room_id.clone();
    let user = database.local_user_id.clone();
    let sender = serde_json::to_string(&SenderSnapshot {
        display_name: "基准昵称".into(),
        kind: ParticipantKind::User,
        avatar_id: None,
    })
    .unwrap();
    let transaction = database.conn.transaction().unwrap();
    {
        let mut messages = transaction
            .prepare("INSERT INTO messages(seq, id, room_id, sender_id, sender_snapshot_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
            .unwrap();
        let mut parts = transaction
            .prepare("INSERT INTO message_parts VALUES (?1, 0, 'text', ?2)")
            .unwrap();
        let mut text = transaction
            .prepare("INSERT INTO search_text(seq, text) VALUES (?1, ?2)")
            .unwrap();
        for index in 1..=size {
            let id = format!("corpus-{index:06}");
            let body = if index % 97 == 0 {
                format!(
                    "第 {index} 条中文基准记录；长文本跨日期。{} 结尾保留 CJK/ASCII literal context。",
                    "可取消查询与稳定历史分页不会加载全部记录。".repeat(12)
                )
            } else {
                format!("第 {index} 条中文基准记录，日期与消息序号分别保存。")
            };
            messages
                .execute(params![
                    index,
                    id,
                    room,
                    user,
                    sender,
                    1_760_000_000_000_i64 + index * 3_600_000
                ])
                .unwrap();
            parts.execute(params![id, body]).unwrap();
            text.execute(params![index, body]).unwrap();
        }
    }
    transaction
        .execute(
            "INSERT INTO message_search(message_search) VALUES ('rebuild')",
            [],
        )
        .unwrap();
    transaction.commit().unwrap();
}

#[test]
fn initialization_retries_after_its_staging_path_is_unblocked() {
    let directory = TempDir::new().unwrap();
    let staging = directory.path().join("staging");
    let obstacle = b"only this test owns the staging obstruction";
    fs::write(&staging, obstacle).unwrap();
    assert_code(
        Database::open(directory.path(), "blocked-initialization".into()),
        ErrorCode::IoError,
    );
    assert!(!directory.path().join("chat.sqlite3").exists());
    assert!(!directory.path().join("data-manifest.json").exists());
    assert_eq!(fs::read(&staging).unwrap(), obstacle);
    fs::remove_file(&staging).unwrap();
    let mut reopened = Database::open(directory.path(), "retried-initialization".into()).unwrap();
    assert_eq!(snapshot(&mut reopened).participants.len(), 2);
    assert_eq!(count(&reopened.conn, "messages"), 0);
}

#[test]
fn unpublished_failed_staging_database_is_not_activated_or_removed() {
    let directory = TempDir::new().unwrap();
    let previous = directory.path().join("staging").join("init-unpublished");
    fs::create_dir_all(&previous).unwrap();
    let abandoned = previous.join("chat.sqlite3");
    let partial = Connection::open(&abandoned).unwrap();
    partial
        .execute_batch("CREATE TABLE interrupted_init (value TEXT); INSERT INTO interrupted_init VALUES ('unpublished');")
        .unwrap();
    drop(partial);
    let before = fs::read(&abandoned).unwrap();
    let mut opened = Database::open(directory.path(), "fresh-initialization".into()).unwrap();
    assert_eq!(snapshot(&mut opened).participants.len(), 2);
    assert_eq!(count(&opened.conn, "messages"), 0);
    let foreign_table: bool = opened
        .conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_schema WHERE name = 'interrupted_init')",
            [],
            |row| row.get(0),
        )
        .unwrap();
    assert!(!foreign_table);
    assert_eq!(fs::read(&abandoned).unwrap(), before);
}

#[test]
fn published_database_with_interrupted_manifest_write_recovers_verified_metadata() {
    let (directory, mut opened) = database();
    let original = snapshot(&mut opened);
    let committed = send(
        &mut opened,
        "before-manifest-interruption",
        "已提交历史不能重新初始化",
    );
    let root_id: String = opened
        .conn
        .query_row(
            "SELECT root_id FROM app_meta WHERE singleton = 1",
            [],
            |row| row.get(0),
        )
        .unwrap();
    drop(opened);
    let manifest = directory.path().join("data-manifest.json");
    fs::remove_file(&manifest).unwrap();
    let mut recovered = Database::open(directory.path(), "manifest-recovery".into()).unwrap();
    assert_eq!(
        snapshot(&mut recovered).local_user.id,
        original.local_user.id
    );
    assert_eq!(list(&mut recovered, 50).items[0].id, committed.message_id);
    let materialized: Value = serde_json::from_slice(&fs::read(manifest).unwrap()).unwrap();
    assert_eq!(materialized["root_id"], root_id);
}

#[test]
fn room_owner_rename_persists_and_emits_snapshot_consistent_event() {
    let (directory, mut database) = database();
    let message = send(&mut database, "room-name-history", "修改群名前的消息");
    let original = snapshot(&mut database);
    let request = room_request(&database, "  新的聊天室  ");
    let (room, event) = database.save_room(request).unwrap();
    let event = event.unwrap();
    assert_eq!(room.name, "新的聊天室");
    assert_eq!(room.version.0, "2");
    assert_eq!(room.owner_participant_id, original.local_user.id);
    assert_eq!(room.content_epoch.0, original.room.content_epoch.0);
    match &event.payload {
        EventPayload::RoomChanged { room: changed } => {
            assert_eq!(changed.id, room.id);
            assert_eq!(changed.name, room.name);
            assert_eq!(changed.version.0, room.version.0);
        }
        other => panic!("群名修改产生了错误事件：{other:?}"),
    }
    let updated = database
        .snapshot(AppSnapshotRequest {
            data_generation_id: Some(database.generation_id.clone()),
            last_event_seq: Some(original.latest_event_seq),
        })
        .unwrap();
    assert_eq!(updated.room.name, room.name);
    assert_eq!(updated.room.version.0, "2");
    assert_eq!(updated.events.len(), 1);
    assert_eq!(updated.events[0].event_id, event.event_id);
    assert_eq!(updated.latest_message_seq.0, "1");
    assert_eq!(list(&mut database, 50).items[0].id, message.message_id);
    drop(database);
    let mut reopened = Database::open(directory.path(), "generation-reopened".into()).unwrap();
    assert_eq!(snapshot(&mut reopened).room.name, "新的聊天室");
    assert_eq!(snapshot(&mut reopened).room.version.0, "2");
}

#[test]
fn room_non_owner_cannot_change_name_or_emit_event() {
    let (_directory, mut database) = database();
    let owner = snapshot(&mut database)
        .participants
        .into_iter()
        .find(|participant| participant.kind == ParticipantKind::Agent)
        .unwrap();
    database
        .conn
        .execute(
            "UPDATE room SET owner_participant_id = ?1 WHERE singleton = 1",
            [&owner.id],
        )
        .unwrap();
    let before = snapshot(&mut database).room;
    let request = room_request(&database, "无权限修改");
    assert_code(database.save_room(request), ErrorCode::PermissionDenied);
    let after = snapshot(&mut database).room;
    assert_eq!(after.name, before.name);
    assert_eq!(after.version.0, before.version.0);
    assert_eq!(after.owner_participant_id, before.owner_participant_id);
    assert_eq!(count(&database.conn, "domain_events"), 0);
    assert_eq!(count(&database.conn, "request_records"), 0);
}

#[test]
fn room_stale_version_preserves_current_name() {
    let (_directory, mut database) = database();
    let first = room_request(&database, "已保存的群名");
    database.save_room(first).unwrap();
    let stale = room_request(&database, "过期修改");
    assert_code(database.save_room(stale), ErrorCode::ConfigConflict);
    assert_eq!(snapshot(&mut database).room.name, "已保存的群名");
    assert_eq!(snapshot(&mut database).room.version.0, "2");
    assert_eq!(count(&database.conn, "domain_events"), 1);
    assert_eq!(count(&database.conn, "request_records"), 1);
}

#[test]
fn room_name_rejects_blank_long_and_null_values_and_accepts_unicode_boundary() {
    let (_directory, mut database) = database();
    for name in [" \n\t".to_owned(), "群".repeat(81), "含\0字符".to_owned()] {
        let request = room_request(&database, &name);
        assert_code(database.save_room(request), ErrorCode::InvalidInput);
    }
    assert_eq!(snapshot(&mut database).room.version.0, "1");
    assert_eq!(count(&database.conn, "domain_events"), 0);
    let name = "群".repeat(80);
    let request = room_request(&database, &name);
    assert_eq!(database.save_room(request).unwrap().0.name, name);
}

#[test]
fn room_generation_and_uuid_are_validated_before_mutation() {
    let (_directory, mut database) = database();
    let mut request = room_request(&database, "新群名");
    request.data_generation_id = "old-generation".into();
    assert_code(
        database.save_room(request),
        ErrorCode::DataGenerationChanged,
    );
    let mut request = room_request(&database, "新群名");
    request.client_request_id = "not-a-uuid".into();
    assert_code(database.save_room(request), ErrorCode::InvalidInput);
    assert_eq!(snapshot(&mut database).room.version.0, "1");
    assert_eq!(count(&database.conn, "domain_events"), 0);
    assert_eq!(count(&database.conn, "request_records"), 0);
}

#[test]
fn room_save_is_idempotent_and_reused_identifier_rejects_other_content() {
    let (_directory, mut database) = database();
    let request = room_request(&database, "幂等群名");
    let (first, event) = database.save_room(request.clone()).unwrap();
    assert!(event.is_some());
    let (replayed, event) = database.save_room(request.clone()).unwrap();
    assert_eq!(replayed.name, first.name);
    assert_eq!(replayed.version.0, first.version.0);
    assert!(event.is_none());
    let changed = RoomSaveRequest {
        name: "同标识不同内容".into(),
        ..request
    };
    assert_code(database.save_room(changed), ErrorCode::IdempotencyConflict);
    assert_eq!(snapshot(&mut database).room.version.0, "2");
    assert_eq!(count(&database.conn, "domain_events"), 1);
    assert_eq!(count(&database.conn, "request_records"), 1);
}

#[test]
fn room_save_request_rejects_forged_actor_fields() {
    let (_directory, database) = database();
    let mut request = serde_json::to_value(room_request(&database, "新群名")).unwrap();
    request["owner_participant_id"] = json!(database.local_user_id);
    assert!(serde_json::from_value::<RoomSaveRequest>(request).is_err());
}

#[test]
fn first_start_has_one_user_and_unconfigured_sage_without_fake_chat() {
    let (_directory, mut database) = database();
    let snapshot = snapshot(&mut database);
    assert_eq!(snapshot.participants.len(), 2);
    assert_eq!(snapshot.local_user.kind, ParticipantKind::User);
    let sage = snapshot
        .participants
        .iter()
        .find(|participant| participant.kind == ParticipantKind::Agent)
        .unwrap();
    assert_eq!(sage.display_name, "Sage");
    assert_eq!(sage.status, ParticipantStatus::NeedsConfiguration);
    assert!(sage.is_builtin);
    assert_eq!(snapshot.room.owner_participant_id, snapshot.local_user.id);
    assert_eq!(snapshot.latest_message_seq.0, "0");
    assert!(snapshot.events.is_empty());
    assert!(snapshot.requires_full_reload);
    assert!(list(&mut database, DEFAULT_PAGE_SIZE).items.is_empty());
}

#[test]
fn restart_preserves_identity_history_and_sender_snapshot() {
    let (directory, mut database) = database();
    let original = snapshot(&mut database);
    let sent = send(&mut database, "restart-request", "重启后的历史仍然可读");
    database
        .conn
        .execute(
            "UPDATE participants SET display_name = '修改后的昵称' WHERE id = ?1",
            [&database.local_user_id],
        )
        .unwrap();
    drop(database);
    let mut reopened = Database::open(directory.path(), "generation-restarted".into()).unwrap();
    let restored = snapshot(&mut reopened);
    assert_eq!(restored.local_user.id, original.local_user.id);
    assert_eq!(restored.room.id, original.room.id);
    assert_eq!(restored.local_user.display_name, "修改后的昵称");
    let page = list(&mut reopened, 50);
    assert_eq!(page.items[0].id, sent.message_id);
    assert_eq!(page.items[0].sender_snapshot.display_name, "我");
    assert_eq!(page.data_generation_id, "generation-restarted");
}

#[test]
fn repeated_send_is_idempotent_and_changed_payload_is_rejected() {
    let (_directory, mut database) = database();
    let request = send_request(
        &database.generation_id,
        "idempotent-request",
        "只应保存一次",
    );
    let (first, first_event) = database.send_message(request.clone()).unwrap();
    let (second, second_event) = database.send_message(request.clone()).unwrap();
    assert_eq!(first.message_id, second.message_id);
    assert_eq!(first.message_seq, second.message_seq);
    assert_eq!(first.event_seq, second.event_seq);
    assert!(first_event.is_some());
    assert!(second_event.is_none());
    assert_eq!(count(&database.conn, "messages"), 1);
    assert_eq!(count(&database.conn, "domain_events"), 1);
    let mut changed = request;
    changed.parts = vec![MessagePart::Text {
        text: "不同内容".into(),
    }];
    assert_code(
        database.send_message(changed),
        ErrorCode::IdempotencyConflict,
    );
    assert_eq!(count(&database.conn, "messages"), 1);
}

#[test]
fn explicit_replay_after_restart_uses_current_generation_without_duplicate() {
    let (directory, mut database) = database();
    let request = send_request(
        &database.generation_id,
        "replayed-request",
        "已经提交的文本",
    );
    let original = database.send_message(request.clone()).unwrap().0;
    drop(database);
    let mut database = Database::open(directory.path(), "generation-new".into()).unwrap();
    assert_code(
        database.send_message(request.clone()),
        ErrorCode::DataGenerationChanged,
    );
    let mut confirmed = request;
    confirmed.data_generation_id = "generation-new".into();
    let (replayed, event) = database.send_message(confirmed).unwrap();
    assert_eq!(replayed.data_generation_id, "generation-new");
    assert_eq!(replayed.message_id, original.message_id);
    assert!(event.is_none());
    assert_eq!(count(&database.conn, "messages"), 1);
}

#[test]
fn worker_broadcasts_only_after_commit_and_never_rebroadcasts_replay() {
    let directory = TempDir::new().unwrap();
    let visible = Arc::new(AtomicBool::new(false));
    let callbacks = Arc::new(AtomicUsize::new(0));
    let path = directory.path().join("chat.sqlite3");
    let callback_visible = visible.clone();
    let callback_count = callbacks.clone();
    let worker = DbWorker::open(
        directory.path(),
        "worker-generation".into(),
        Arc::new(move |event| {
            if let EventPayload::MessageCommitted { message_id, .. } = &event.payload {
                let reader = open_reader(&path).unwrap();
                let committed: bool = reader
                    .query_row(
                        "SELECT EXISTS(SELECT 1 FROM messages WHERE id = ?1)",
                        [message_id],
                        |row| row.get(0),
                    )
                    .unwrap();
                callback_visible.store(committed, Ordering::Release);
                callback_count.fetch_add(1, Ordering::AcqRel);
            }
        }),
    )
    .unwrap();
    let request = send_request("worker-generation", "worker-request", "提交后才广播");
    tauri::async_runtime::block_on(worker.send_message(request.clone())).unwrap();
    tauri::async_runtime::block_on(worker.send_message(request)).unwrap();
    assert!(visible.load(Ordering::Acquire));
    assert_eq!(callbacks.load(Ordering::Acquire), 1);
    tauri::async_runtime::block_on(worker.shutdown()).unwrap();
}

#[test]
fn event_write_failure_rolls_back_message_index_and_request_without_broadcast() {
    let directory = TempDir::new().unwrap();
    let callbacks = Arc::new(AtomicUsize::new(0));
    let observed = callbacks.clone();
    let worker = DbWorker::open(
        directory.path(),
        "rollback-generation".into(),
        Arc::new(move |_| {
            observed.fetch_add(1, Ordering::AcqRel);
        }),
    )
    .unwrap();
    tauri::async_runtime::block_on(worker.call(|database| {
        database.conn.execute_batch("CREATE TEMP TRIGGER reject_event BEFORE INSERT ON main.domain_events BEGIN SELECT RAISE(ABORT, 'test event failure'); END;")?;
        Ok(())
    })).unwrap();
    let request = send_request(
        "rollback-generation",
        "rollback-request",
        "失败后不应留下半条消息",
    );
    assert!(tauri::async_runtime::block_on(worker.send_message(request.clone())).is_err());
    tauri::async_runtime::block_on(worker.call(|database| {
        assert_no_chat_rows(&database.conn);
        database
            .conn
            .execute_batch("DROP TRIGGER temp.reject_event")?;
        database.conn.execute(
            "INSERT INTO message_search(message_search, rank) VALUES ('integrity-check', 1)",
            [],
        )?;
        Ok(())
    }))
    .unwrap();
    assert_eq!(callbacks.load(Ordering::Acquire), 0);
    tauri::async_runtime::block_on(worker.send_message(request)).unwrap();
    assert_eq!(callbacks.load(Ordering::Acquire), 1);
    tauri::async_runtime::block_on(worker.shutdown()).unwrap();
}

#[test]
fn text_limits_count_unicode_scalars_and_utf8_bytes_independently() {
    let (_directory, mut database) = database();
    for (id, text) in [
        ("blank", " \t\r\n".to_owned()),
        ("characters-over", "x".repeat(TEXT_CHARACTER_LIMIT + 1)),
        ("bytes-over", "\u{1f680}".repeat(TEXT_BYTE_LIMIT / 4 + 1)),
    ] {
        assert_code(
            database.send_message(send_request(&database.generation_id, id, &text)),
            ErrorCode::InvalidInput,
        );
    }
    send(
        &mut database,
        "characters-at-limit",
        &"x".repeat(TEXT_CHARACTER_LIMIT),
    );
    send(
        &mut database,
        "bytes-at-limit",
        &"\u{1f680}".repeat(TEXT_BYTE_LIMIT / 4),
    );
    assert_eq!(count(&database.conn, "messages"), 2);
    let mut split = send_request(&database.generation_id, "split-over", "");
    split.parts = vec![
        MessagePart::Text {
            text: "x".repeat(5001),
        },
        MessagePart::Text {
            text: "x".repeat(5001),
        },
    ];
    assert_code(database.send_message(split), ErrorCode::InvalidInput);
}

#[test]
fn unsupported_parts_empty_arrays_and_excess_parts_never_commit() {
    let (_directory, mut database) = database();
    for part in [
        MessagePart::Attachment {
            attachment_id: "test-object".into(),
        },
        MessagePart::Emote {
            emote_id: "test-emote".into(),
        },
    ] {
        let mut request = send_request(&database.generation_id, "unsupported", "");
        request.parts = vec![part];
        assert_code(
            database.send_message(request),
            ErrorCode::CapabilityUnsupported,
        );
    }
    let mut request = send_request(&database.generation_id, "empty-parts", "");
    request.parts.clear();
    assert_code(database.send_message(request), ErrorCode::InvalidInput);
    let mut request = send_request(&database.generation_id, "too-many-parts", "");
    request.parts = (0..17)
        .map(|_| MessagePart::Text { text: "x".into() })
        .collect();
    assert_code(database.send_message(request), ErrorCode::InvalidInput);
    assert_no_chat_rows(&database.conn);
}

#[test]
fn ids_quotes_mentions_and_owner_permission_are_validated() {
    let (_directory, mut database) = database();
    let mut bad = send_request(&database.generation_id, "", "无效标识");
    assert_code(database.send_message(bad.clone()), ErrorCode::InvalidInput);
    bad.client_request_id = "request-missing-quote".into();
    bad.quote_message_id = Some("not-a-message".into());
    assert_code(database.send_message(bad), ErrorCode::MessageNotFound);
    let mut missing = send_request(
        &database.generation_id,
        "request-missing-member",
        "无效提及",
    );
    missing.mention_ids = vec!["not-a-member".into()];
    assert_code(database.send_message(missing), ErrorCode::InvalidInput);
    let sage: String = database
        .conn
        .query_row(
            "SELECT id FROM participants WHERE kind = 'agent'",
            [],
            |row| row.get(0),
        )
        .unwrap();
    database
        .conn
        .execute(
            "UPDATE room SET owner_participant_id = ?1 WHERE singleton = 1",
            [&sage],
        )
        .unwrap();
    let mut all = send_request(
        &database.generation_id,
        "not-owner-all",
        "普通成员不应有所有人权限",
    );
    all.mention_all = true;
    assert_code(database.send_message(all), ErrorCode::PermissionDenied);
    send(
        &mut database,
        "ordinary-message",
        "群主改变不阻止普通文本发送",
    );
    assert_eq!(count(&database.conn, "messages"), 1);
}

#[test]
fn valid_quotes_and_duplicate_mentions_use_stable_ids() {
    let (_directory, mut database) = database();
    let original = send(&mut database, "quoted-original", "被引用的文本");
    let sage: String = database
        .conn
        .query_row(
            "SELECT id FROM participants WHERE kind = 'agent'",
            [],
            |row| row.get(0),
        )
        .unwrap();
    let mut request = send_request(&database.generation_id, "quoted-reply", "引用回复");
    request.quote_message_id = Some(original.message_id.clone());
    request.mention_ids = vec![sage.clone(), sage.clone()];
    database.send_message(request).unwrap();
    let page = list(&mut database, 50);
    assert_eq!(
        page.items[1].quote_message_id.as_deref(),
        Some(original.message_id.as_str())
    );
    assert_eq!(page.items[1].mention_ids, vec![sage]);
}

#[test]
fn keyset_pages_are_ordered_exclusive_and_not_timestamp_sorted() {
    let (_directory, mut database) = database();
    for index in 1..=12 {
        send(
            &mut database,
            &format!("page-{index}"),
            &format!("第{index}条"),
        );
    }
    database
        .conn
        .execute(
            "UPDATE messages SET created_at = CASE WHEN seq = 12 THEN 0 ELSE 2000000000000 END",
            [],
        )
        .unwrap();
    let latest = list(&mut database, 4);
    let values: Vec<_> = latest
        .items
        .iter()
        .map(|message| message.seq.0.as_str())
        .collect();
    assert_eq!(values, ["9", "10", "11", "12"]);
    assert!(latest.has_more_before);
    assert!(!latest.has_more_after);
    let mut before = list_request(&database.generation_id, 4);
    before.before_seq = latest.first_seq.clone();
    let older = database.list_messages(before).unwrap();
    assert_eq!(older.items[0].seq.0, "5");
    assert_eq!(older.items[3].seq.0, "8");
    let mut after = list_request(&database.generation_id, 4);
    after.after_seq = older.last_seq;
    assert_eq!(database.list_messages(after).unwrap().items[0].seq.0, "9");
    let mut around = list_request(&database.generation_id, 5);
    around.around_seq = Some(6_i64.into());
    let around = database.list_messages(around).unwrap();
    assert!(around.items.iter().any(|message| message.seq.0 == "6"));
    assert!(
        around
            .items
            .windows(2)
            .all(|items| parse_counter(&items[0].seq, "seq").unwrap()
                < parse_counter(&items[1].seq, "seq").unwrap())
    );
}

#[test]
fn invalid_pagination_cursors_limits_and_generations_are_rejected() {
    let (_directory, mut database) = database();
    send(&mut database, "only-message", "只有一条");
    for limit in [0, 201] {
        let request = list_request(&database.generation_id, limit);
        assert_code(database.list_messages(request), ErrorCode::InvalidInput);
    }
    let mut mixed = list_request(&database.generation_id, 50);
    mixed.before_seq = Some(1_i64.into());
    mixed.after_seq = Some(0_i64.into());
    assert_code(database.list_messages(mixed), ErrorCode::InvalidInput);
    for text in ["", "01", "+1", "-1", "1e3", "9223372036854775808"] {
        let mut request = list_request(&database.generation_id, 50);
        request.after_seq = Some(DecimalString(text.into()));
        assert_code(database.list_messages(request), ErrorCode::InvalidInput);
    }
    for (before, after) in [
        (Some(0_i64), None),
        (Some(2_i64), None),
        (None, Some(2_i64)),
    ] {
        let mut request = list_request(&database.generation_id, 50);
        request.before_seq = before.map(Into::into);
        request.after_seq = after.map(Into::into);
        assert_code(database.list_messages(request), ErrorCode::InvalidInput);
    }
    let mut missing = list_request(&database.generation_id, 50);
    missing.around_seq = Some(99_i64.into());
    assert_code(database.list_messages(missing), ErrorCode::MessageNotFound);
    assert_code(
        database.list_messages(list_request("old-generation", 50)),
        ErrorCode::DataGenerationChanged,
    );
}

#[test]
fn wire_sequences_above_javascript_safe_integer_remain_strings() {
    let (_directory, mut database) = database();
    send(&mut database, "before-large-seq", "种子记录");
    database
        .conn
        .execute(
            "UPDATE sqlite_sequence SET seq = 9007199254740992 WHERE name = 'messages'",
            [],
        )
        .unwrap();
    let sent = send(
        &mut database,
        "large-seq",
        "大序号不能转为 JavaScript number",
    );
    assert_eq!(sent.message_seq.0, "9007199254740993");
    let wire = serde_json::to_value(ApiResponse::from(Ok::<_, AppError>(sent))).unwrap();
    assert_eq!(wire["data"]["message_seq"], json!("9007199254740993"));
    assert!(wire["data"]["message_seq"].is_string());
    assert!(
        serde_json::to_value(list(&mut database, 50)).unwrap()["items"][1]["created_at"]
            .is_number()
    );
}

#[test]
fn committed_message_and_event_sequences_are_not_reused_after_deletion() {
    let (_directory, mut database) = database();
    send(&mut database, "retained-seq", "保留的记录");
    let deleted = send(&mut database, "deleted-seq", "删除的最高序号");
    let message_seq = parse_counter(&deleted.message_seq, "message_seq").unwrap();
    let event_seq = parse_counter(&deleted.event_seq, "event_seq").unwrap();
    let transaction = database.conn.transaction().unwrap();
    transaction.execute("INSERT INTO message_search(message_search, rowid, text) SELECT 'delete', seq, text FROM search_text WHERE seq = ?1", [message_seq]).unwrap();
    transaction
        .execute("DELETE FROM search_text WHERE seq = ?1", [message_seq])
        .unwrap();
    transaction
        .execute("DELETE FROM messages WHERE seq = ?1", [message_seq])
        .unwrap();
    transaction
        .execute("DELETE FROM domain_events WHERE seq = ?1", [event_seq])
        .unwrap();
    transaction.commit().unwrap();
    assert_eq!(
        allocated_seq(&database.conn, "messages").unwrap(),
        message_seq
    );
    let next = send(&mut database, "next-seq", "不会复用已删除序号");
    assert!(parse_counter(&next.message_seq, "message_seq").unwrap() > message_seq);
    assert!(parse_counter(&next.event_seq, "event_seq").unwrap() > event_seq);
    assert!(
        search_database(
            &database.conn,
            &search_request(&database.generation_id, "deleted-search", "删除的最高序号")
        )
        .unwrap()
        .items
        .is_empty()
    );
    verify_database(&database.conn).unwrap();
}

#[test]
fn snapshot_replays_committed_events_and_resets_invalid_cursors() {
    let (_directory, mut database) = database();
    let first = send(&mut database, "event-one", "第一个事件");
    let second = send(&mut database, "event-two", "第二个事件");
    let replay = database
        .snapshot(AppSnapshotRequest {
            data_generation_id: Some(database.generation_id.clone()),
            last_event_seq: Some(first.event_seq),
        })
        .unwrap();
    assert!(!replay.requires_full_reload);
    assert_eq!(replay.events.len(), 1);
    assert_eq!(replay.events[0].event_seq, second.event_seq);
    assert_eq!(replay.events[0].data_generation_id, database.generation_id);
    for request in [
        AppSnapshotRequest {
            data_generation_id: Some("old-generation".into()),
            last_event_seq: Some(0_i64.into()),
        },
        AppSnapshotRequest {
            data_generation_id: Some(database.generation_id.clone()),
            last_event_seq: Some(99_i64.into()),
        },
    ] {
        let reset = database.snapshot(request).unwrap();
        assert!(reset.requires_full_reload);
        assert!(reset.events.is_empty());
    }
    database
        .conn
        .execute("DELETE FROM domain_events WHERE seq = 1", [])
        .unwrap();
    let reset = database
        .snapshot(AppSnapshotRequest {
            data_generation_id: Some(database.generation_id.clone()),
            last_event_seq: Some(0_i64.into()),
        })
        .unwrap();
    assert!(reset.requires_full_reload);
    assert!(reset.events.is_empty());
}

#[test]
fn unicode_literal_search_matches_rust_contains_without_normalization_or_injection() {
    let (_directory, mut database) = database();
    let texts = [
        "中文子串：中、中文、中文子串都可检索。",
        "大小写 Alpha alpha ALPHA 分别保留。",
        "café cafe\u{301} CAFÉ 保留重音与组合形式。",
        "全角ＡＢＣ和半角ABC不同。",
        "Unicode \u{1f680} 与 \u{1f469}\u{200d}\u{1f4bb} 不是字节计数。",
        "引号\"、百分号%、下划线_与空格 a b 按字面。",
        "' OR 1=1 -- 仅是一段聊天文本。",
        "<script>window.shouldNotRun = true</script> 不执行。",
        "换行\n原文仍然是可检索文本。",
    ];
    let mut entries = Vec::new();
    for (index, text) in texts.iter().enumerate() {
        let result = send(&mut database, &format!("literal-{index}"), text);
        entries.push((parse_counter(&result.message_seq, "seq").unwrap(), *text));
    }
    for query in [
        "中",
        "中文",
        "中文子",
        "Alpha",
        "alpha",
        "ALPHA",
        "café",
        "cafe\u{301}",
        "CAFÉ",
        "ＡＢＣ",
        "ABC",
        "\u{1f680}",
        "\u{1f469}\u{200d}\u{1f4bb}",
        "\"",
        "%",
        "_",
        "a b",
        "' OR 1=1 --",
        "<script>",
        "\n原",
        "不存在",
    ] {
        let result = search_database(
            &database.conn,
            &search_request(&database.generation_id, "literal-search", query),
        )
        .unwrap();
        let mut expected: Vec<_> = entries
            .iter()
            .filter(|(_, text)| text.contains(query))
            .map(|(seq, _)| *seq)
            .collect();
        expected.sort_unstable_by(|left, right| right.cmp(left));
        let actual: Vec<_> = result
            .items
            .iter()
            .map(|hit| parse_counter(&hit.seq, "seq").unwrap())
            .collect();
        assert_eq!(actual, expected, "查询 {query:?} 的字面语义不一致");
        assert!(!result.has_more);
        assert!(matches!(
            result.semantics,
            SearchSemantics::LiteralUnicodeSubstring
        ));
    }
    assert_eq!(count(&database.conn, "messages"), texts.len() as i64);
}

#[test]
fn search_cursor_is_bound_to_query_and_generation() {
    let (_directory, mut database) = database();
    for index in 0..5 {
        send(&mut database, &format!("cursor-{index}"), "共同查询文本");
    }
    let mut request = search_request(&database.generation_id, "cursor-query", "共同");
    request.limit = 2;
    let first = search_database(&database.conn, &request).unwrap();
    assert_eq!(first.items.len(), 2);
    assert!(first.has_more);
    request.cursor = first.next_cursor;
    let second = search_database(&database.conn, &request).unwrap();
    assert_eq!(second.items.len(), 2);
    assert!(
        parse_counter(&second.items[0].seq, "seq").unwrap()
            < parse_counter(&first.items[1].seq, "seq").unwrap()
    );
    let mut changed = request.clone();
    changed.query = "文本".into();
    assert_code(
        search_database(&database.conn, &changed),
        ErrorCode::InvalidInput,
    );
    changed = request.clone();
    changed.data_generation_id = "other-generation".into();
    assert_code(
        search_database(&database.conn, &changed),
        ErrorCode::InvalidInput,
    );
    for cursor in ["not-json", "{\"before_seq\":1}"] {
        let mut invalid = request.clone();
        invalid.cursor = Some(cursor.into());
        assert_code(
            search_database(&database.conn, &invalid),
            ErrorCode::InvalidInput,
        );
    }
}

#[test]
fn invalid_search_inputs_are_not_reported_as_empty_success() {
    let (_directory, database) = database();
    for query in ["".to_owned(), "  \n\t".to_owned(), "字".repeat(257)] {
        let request = search_request(&database.generation_id, "invalid-search", &query);
        assert_code(
            search_database(&database.conn, &request),
            ErrorCode::InvalidInput,
        );
    }
    let mut request = search_request(&database.generation_id, "invalid-limit", "字");
    request.limit = 201;
    assert_code(
        search_database(&database.conn, &request),
        ErrorCode::InvalidInput,
    );
}

#[test]
fn real_hundred_thousand_row_corpus_supports_keyset_and_literal_search() {
    let (_directory, mut database) = database();
    let fixture_started = Instant::now();
    populate_corpus(&mut database, 100_000);
    let query_started = Instant::now();
    let page = list(&mut database, 50);
    assert_eq!(page.items.len(), 50);
    assert_eq!(page.first_seq.unwrap().0, "99951");
    assert_eq!(page.last_seq.unwrap().0, "100000");
    let mut before = list_request(&database.generation_id, 50);
    before.before_seq = Some(99951_i64.into());
    let earlier = database.list_messages(before).unwrap();
    assert_eq!(earlier.items.first().unwrap().seq.0, "99901");
    let search = search_database(
        &database.conn,
        &search_request(
            &database.generation_id,
            "corpus-search",
            "第 12345 条中文基准记录",
        ),
    )
    .unwrap();
    assert_eq!(search.items.len(), 1);
    assert_eq!(search.items[0].seq.0, "12345");
    let short = search_database(
        &database.conn,
        &search_request(&database.generation_id, "corpus-short", "罕"),
    )
    .unwrap();
    assert!(short.items.is_empty());
    assert_eq!(count(&database.conn, "messages"), 100_000);
    eprintln!(
        "100000 条真实 SQLite 合成数据：准备 {:?}，分页与三次检索 {:?}；不是正式 p95 性能结果。",
        query_started.duration_since(fixture_started),
        query_started.elapsed()
    );
}

#[test]
fn active_large_search_cancels_in_its_window_without_waiting_for_writer_queue() {
    let directory = TempDir::new().unwrap();
    let worker = DbWorker::open(
        directory.path(),
        "cancel-generation".into(),
        Arc::new(|_| {}),
    )
    .unwrap();
    tauri::async_runtime::block_on(worker.call(|database| {
        populate_corpus(database, 100_000);
        Ok(())
    }))
    .unwrap();
    let (started, writer_started) = mpsc::channel();
    let (release, released) = mpsc::channel();
    let writer_finished = Arc::new(AtomicBool::new(false));
    let blocked_worker = worker.clone();
    let finished = writer_finished.clone();
    let blocked_writer = tauri::async_runtime::spawn(async move {
        blocked_worker
            .call(move |database| {
                database.conn.execute_batch("BEGIN IMMEDIATE")?;
                started.send(()).unwrap();
                let released = released.recv_timeout(Duration::from_secs(5)).is_ok();
                database.conn.execute_batch("ROLLBACK")?;
                finished.store(true, Ordering::Release);
                assert!(released, "测试中的写事务未获得释放信号");
                Ok(())
            })
            .await
    });
    writer_started.recv_timeout(Duration::from_secs(2)).unwrap();
    let waker = Waker::noop();
    let mut cancelled_search = false;
    for attempt in 0..3 {
        let search_id = format!("large-cancel-{attempt}");
        let request = search_request("cancel-generation", &search_id, "罕");
        let future = worker.search.search("main".into(), request);
        let mut future = pin!(future);
        let first = future.as_mut().poll(&mut Context::from_waker(waker));
        if let Poll::Ready(result) = first {
            assert!(result.unwrap().items.is_empty());
            continue;
        }
        let wrong_window = worker
            .search
            .cancel(
                "settings",
                CancelSearchRequest {
                    data_generation_id: "cancel-generation".into(),
                    search_id: search_id.clone(),
                },
            )
            .unwrap();
        assert!(!wrong_window.cancellation_requested);
        assert_code(
            worker.search.cancel(
                "main",
                CancelSearchRequest {
                    data_generation_id: "old-generation".into(),
                    search_id: search_id.clone(),
                },
            ),
            ErrorCode::DataGenerationChanged,
        );
        let cancellation = worker
            .search
            .cancel(
                "main",
                CancelSearchRequest {
                    data_generation_id: "cancel-generation".into(),
                    search_id,
                },
            )
            .unwrap();
        let result = tauri::async_runtime::block_on(future);
        if cancellation.cancellation_requested
            && result
                .as_ref()
                .is_err_and(|error| error.code == ErrorCode::SearchCancelled)
        {
            cancelled_search = true;
            break;
        }
        assert!(result.unwrap().items.is_empty());
    }
    assert!(cancelled_search, "大数据检索应有一次真实的待取消机会");
    let no_active = worker
        .search
        .cancel(
            "main",
            CancelSearchRequest {
                data_generation_id: "cancel-generation".into(),
                search_id: "already-finished".into(),
            },
        )
        .unwrap();
    assert!(!no_active.cancellation_requested);
    assert!(
        !writer_finished.load(Ordering::Acquire),
        "取消检索不应等待写事务结束"
    );
    release.send(()).unwrap();
    tauri::async_runtime::block_on(blocked_writer)
        .unwrap()
        .unwrap();
    tauri::async_runtime::block_on(worker.shutdown()).unwrap();
}

#[test]
fn wal_online_backup_reopens_all_committed_data_and_never_overwrites_target() {
    let (directory, mut database) = database();
    database
        .conn
        .pragma_update(None, "wal_autocheckpoint", 0)
        .unwrap();
    send(&mut database, "backup-one", "WAL 中的已提交记录");
    send(&mut database, "backup-two", "中文快照可以检索");
    assert!(
        fs::metadata(directory.path().join("chat.sqlite3-wal"))
            .unwrap()
            .len()
            > 0
    );
    let target = directory.path().join("snapshot.sqlite3");
    backup_database(&database.conn, &target).unwrap();
    let copied = open_reader(&target).unwrap();
    verify_database(&copied).unwrap();
    assert_eq!(count(&copied, "messages"), 2);
    assert_eq!(count(&copied, "request_records"), 2);
    let hits = search_database(
        &copied,
        &search_request(&database.generation_id, "backup-search", "中文快照"),
    )
    .unwrap();
    assert_eq!(hits.items.len(), 1);
    drop(copied);
    let bytes = fs::read(&target).unwrap();
    assert_code(
        backup_database(&database.conn, &target),
        ErrorCode::InvalidInput,
    );
    assert_eq!(fs::read(&target).unwrap(), bytes);
}

#[test]
fn busy_database_keeps_transaction_empty_and_allows_same_request_retry() {
    let (_directory, mut database) = database();
    let locker = Connection::open(database.root.join("chat.sqlite3")).unwrap();
    configure_connection(&locker).unwrap();
    locker.execute_batch("BEGIN IMMEDIATE").unwrap();
    let request = send_request(&database.generation_id, "busy-request", "忙碌时不显示成功");
    assert_code(database.send_message(request.clone()), ErrorCode::DbBusy);
    assert_no_chat_rows(&database.conn);
    locker.execute_batch("ROLLBACK").unwrap();
    database.send_message(request).unwrap();
    assert_eq!(count(&database.conn, "messages"), 1);
}

#[test]
fn sqlite_page_limit_models_disk_full_without_filling_user_disk() {
    let (_directory, mut database) = database();
    let pages: i64 = database
        .conn
        .pragma_query_value(None, "page_count", |row| row.get(0))
        .unwrap();
    database
        .conn
        .pragma_update(None, "max_page_count", pages)
        .unwrap();
    let text = "\u{1f680}".repeat(TEXT_BYTE_LIMIT / 4);
    let request = send_request(&database.generation_id, "disk-full-request", &text);
    assert_code(database.send_message(request.clone()), ErrorCode::DiskFull);
    assert_no_chat_rows(&database.conn);
    database
        .conn
        .pragma_update(None, "max_page_count", pages + 4096)
        .unwrap();
    database.send_message(request).unwrap();
    assert_eq!(count(&database.conn, "messages"), 1);
}

#[test]
fn corrupt_database_is_preserved_instead_of_replaced_with_empty_database() {
    let directory = TempDir::new().unwrap();
    let path = directory.path().join("chat.sqlite3");
    let bytes = b"not a SQLite database; isolated malformed fixture";
    fs::write(&path, bytes).unwrap();
    assert_code(
        Database::open(directory.path(), "corrupt-generation".into()),
        ErrorCode::DbCorrupt,
    );
    assert_eq!(fs::read(&path).unwrap(), bytes);
    assert!(!directory.path().join("data-manifest.json").exists());
}

#[test]
fn future_schema_is_rejected_before_writing_database_bytes() {
    let (directory, database) = database();
    database
        .conn
        .pragma_update(None, "user_version", CURRENT_SCHEMA + 1)
        .unwrap();
    drop(database);
    let path = directory.path().join("chat.sqlite3");
    let before = fs::read(&path).unwrap();
    assert_code(
        Database::open(directory.path(), "future-generation".into()),
        ErrorCode::SchemaUnsupported,
    );
    assert_eq!(fs::read(&path).unwrap(), before);
}

#[test]
fn manifest_with_missing_database_never_creates_empty_replacement() {
    let (directory, database) = database();
    drop(database);
    let manifest = directory.path().join("data-manifest.json");
    let before = fs::read(&manifest).unwrap();
    fs::remove_file(directory.path().join("chat.sqlite3")).unwrap();
    assert_code(
        Database::open(directory.path(), "missing-generation".into()),
        ErrorCode::DataRootInvalid,
    );
    assert!(!directory.path().join("chat.sqlite3").exists());
    assert_eq!(fs::read(manifest).unwrap(), before);
}

#[test]
fn mismatched_and_oversized_manifests_are_preserved() {
    let (directory, database) = database();
    database
        .conn
        .pragma_update(None, "journal_mode", "DELETE")
        .unwrap();
    drop(database);
    let manifest = directory.path().join("data-manifest.json");
    let database_path = directory.path().join("chat.sqlite3");
    let before_database = fs::read(&database_path).unwrap();
    for bytes in [
        b"{not valid json}".to_vec(),
        json!({ "format_version": 1, "schema_version": 1, "root_id": "wrong-root" })
            .to_string()
            .into_bytes(),
        vec![b'x'; 4097],
    ] {
        fs::write(&manifest, &bytes).unwrap();
        assert_code(
            Database::open(directory.path(), "invalid-manifest".into()),
            ErrorCode::DataRootInvalid,
        );
        assert_eq!(fs::read(&manifest).unwrap(), bytes);
        assert!(
            fs::read(&database_path).unwrap() == before_database,
            "拒绝无效清单不得改动数据库字节"
        );
        let journal_mode: String = open_reader(&database_path)
            .unwrap()
            .pragma_query_value(None, "journal_mode", |row| row.get(0))
            .unwrap();
        assert_eq!(journal_mode, "delete");
    }
}

#[test]
fn root_writer_lock_rejects_second_writer_and_releases_on_drop() {
    let (directory, database) = database();
    assert_code(
        Database::open(directory.path(), "second-writer".into()),
        ErrorCode::DbBusy,
    );
    drop(database);
    Database::open(directory.path(), "after-drop".into()).unwrap();
}

#[test]
fn appearance_revision_conflict_and_replay_do_not_duplicate_events() {
    let (_directory, mut database) = database();
    let request = AppearanceSaveRequest {
        data_generation_id: database.generation_id.clone(),
        client_request_id: "appearance-request".into(),
        expected_revision: 1_i64.into(),
        theme: Theme::Dark,
        reduce_motion: true,
    };
    let (saved, event) = database.save_appearance(request.clone()).unwrap();
    assert_eq!(saved.theme, Theme::Dark);
    assert!(saved.reduce_motion);
    assert_eq!(saved.revision.0, "2");
    assert!(event.is_some());
    let (replayed, event) = database.save_appearance(request).unwrap();
    assert_eq!(replayed.revision.0, "2");
    assert!(event.is_none());
    assert_eq!(count(&database.conn, "domain_events"), 1);
    let stale = AppearanceSaveRequest {
        data_generation_id: database.generation_id.clone(),
        client_request_id: "stale-appearance".into(),
        expected_revision: 1_i64.into(),
        theme: Theme::Light,
        reduce_motion: false,
    };
    assert_code(database.save_appearance(stale), ErrorCode::ConfigConflict);
    assert_eq!(snapshot(&mut database).appearance.theme, Theme::Dark);
}

#[test]
fn shutdown_rejects_new_work_and_releases_writer_lock() {
    let directory = TempDir::new().unwrap();
    let worker = DbWorker::open(
        directory.path(),
        "shutdown-generation".into(),
        Arc::new(|_| {}),
    )
    .unwrap();
    tauri::async_runtime::block_on(worker.clone().shutdown()).unwrap();
    assert_code(
        tauri::async_runtime::block_on(worker.send_message(send_request(
            "shutdown-generation",
            "after-shutdown",
            "不应写入",
        ))),
        ErrorCode::ShuttingDown,
    );
    assert_code(
        tauri::async_runtime::block_on(worker.search.search(
            "main".into(),
            search_request("shutdown-generation", "search-after-shutdown", "字"),
        )),
        ErrorCode::ShuttingDown,
    );
    let reopened = Database::open(directory.path(), "after-shutdown".into()).unwrap();
    assert_eq!(count(&reopened.conn, "messages"), 0);
}

#[derive(Deserialize)]
struct ContractFixture {
    name: String,
    contract: String,
    valid: bool,
    payload: Value,
}

fn fixture_valid(fixture: &ContractFixture) -> bool {
    match fixture.contract.as_str() {
        "ChatSendRequest" => {
            serde_json::from_value::<ChatSendRequest>(fixture.payload.clone()).is_ok()
        }
        "ChatListRequest" => serde_json::from_value::<ChatListRequest>(fixture.payload.clone())
            .is_ok_and(|request| super::chat::validate_list(&request).is_ok()),
        "ChatSendResponse" => {
            serde_json::from_value::<ApiResponse<ChatSendResult>>(fixture.payload.clone())
                .is_ok_and(|response| match response {
                    ApiResponse::Success(response) => {
                        parse_counter(&response.data.message_seq, "message_seq").is_ok()
                            && parse_counter(&response.data.event_seq, "event_seq").is_ok()
                    }
                    ApiResponse::Failure(_) => true,
                })
        }
        name => panic!("未知共享合同夹具类型 {name}"),
    }
}

#[test]
fn shared_wire_fixtures_match_serde_and_canonical_counter_contracts() {
    let fixtures: Vec<ContractFixture> =
        serde_json::from_str(include_str!("../../../tests/fixtures/contracts.json")).unwrap();
    assert!(fixtures.len() >= 20);
    for fixture in fixtures {
        assert_eq!(
            fixture_valid(&fixture),
            fixture.valid,
            "共享夹具：{}",
            fixture.name
        );
    }
}
