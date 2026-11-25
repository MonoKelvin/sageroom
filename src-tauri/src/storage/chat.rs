use std::{
    collections::HashSet,
    time::Instant,
};

use rusqlite::{Connection, OptionalExtension, Transaction, params};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::{
    RECALL_WINDOW,
    contracts::*,
    error::{AppResult, now_ms, parse_counter, validate_id},
};

use super::database::{Database, fingerprint};

pub fn allocated_seq(conn: &Connection, table: &str) -> AppResult<i64> {
    Ok(conn.query_row(
        "SELECT COALESCE((SELECT seq FROM sqlite_sequence WHERE name = ?1), 0)",
        [table],
        |row| row.get(0),
    )?)
}

pub fn read_appearance(conn: &Connection) -> AppResult<Appearance> {
    let (theme, reduce_motion, revision): (String, bool, i64) = conn.query_row(
        "SELECT theme, reduce_motion, revision FROM app_settings WHERE singleton = 1",
        [],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    )?;
    Ok(Appearance {
        theme: serde_json::from_value(serde_json::Value::String(theme))?,
        reduce_motion,
        revision: revision.into(),
    })
}

pub(crate) fn participants(conn: &Connection) -> AppResult<Vec<Participant>> {
    let runtime_states = super::runtime::read_runtime_states(conn)?;
    let mut statement = conn.prepare("SELECT id, kind, display_name, status, builtin_key, avatar_id, profile_revision FROM participants ORDER BY kind DESC, created_at, id")?;
    let rows = statement.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, Option<String>>(4)?,
            row.get::<_, Option<String>>(5)?,
            row.get::<_, i64>(6)?,
        ))
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>()?
        .into_iter()
        .map(
            |(id, kind, display_name, status, builtin, avatar_id, revision)| {
                let runtime = runtime_states
                    .iter()
                    .find(|state| state.agent_id == id)
                    .cloned();
                let status = runtime.as_ref().map_or_else(
                    || serde_json::from_value(serde_json::Value::String(status)),
                    |state| Ok(super::runtime::participant_status(&state.status)),
                )?;
                Ok(Participant {
                    id,
                    display_name,
                    kind: serde_json::from_value(serde_json::Value::String(kind))?,
                    status,
                    is_builtin: builtin.is_some(),
                    avatar_id,
                    profile_revision: revision.into(),
                    runtime,
                })
            },
        )
        .collect()
}

fn read_events(conn: &Connection, after: i64, generation: &str) -> AppResult<Vec<DomainEvent>> {
    let mut statement = conn.prepare("SELECT seq, id, occurred_at, payload_json FROM domain_events WHERE seq > ?1 ORDER BY seq LIMIT 513")?;
    let rows = statement.query_map([after], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, String>(3)?,
        ))
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>()?
        .into_iter()
        .map(|(seq, id, occurred_at, payload)| {
            Ok(DomainEvent {
                schema_version: SchemaVersion::V0_3,
                data_generation_id: generation.to_owned(),
                event_seq: seq.into(),
                event_id: id,
                occurred_at,
                payload: serde_json::from_str(&payload)?,
            })
        })
        .collect()
}

pub(crate) fn record_event(
    transaction: &Transaction<'_>,
    payload: EventPayload,
    generation: &str,
) -> AppResult<DomainEvent> {
    let event_id = Uuid::now_v7().to_string();
    let occurred_at = now_ms();
    transaction.execute(
        "INSERT INTO domain_events(id, occurred_at, payload_json) VALUES (?1, ?2, ?3)",
        params![event_id, occurred_at, serde_json::to_string(&payload)?],
    )?;
    let seq = transaction.last_insert_rowid();
    transaction.execute(
        "DELETE FROM domain_events WHERE seq < ?1",
        [seq.saturating_sub(2048)],
    )?;
    Ok(DomainEvent {
        schema_version: SchemaVersion::V0_3,
        data_generation_id: generation.to_owned(),
        event_seq: seq.into(),
        event_id,
        occurred_at,
        payload,
    })
}

pub(crate) fn replay_request(
    conn: &Connection,
    id: &str,
    operation: &str,
    hash: &str,
) -> AppResult<Option<String>> {
    let record: Option<(String, String, String)> = conn.query_row(
        "SELECT operation, payload_hash, result_json FROM request_records WHERE client_request_id = ?1",
        [id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    ).optional()?;
    match record {
        Some((stored_operation, stored_hash, result))
            if stored_operation == operation && stored_hash == hash =>
        {
            Ok(Some(result))
        }
        Some(_) => Err(AppError::new(
            ErrorCode::IdempotencyConflict,
            "此请求标识已经用于其他内容，请刷新状态后重新确认。",
        )),
        None => Ok(None),
    }
}

pub(crate) fn record_request(
    transaction: &Transaction<'_>,
    id: &str,
    operation: &str,
    hash: &str,
    result: &impl Serialize,
) -> AppResult<()> {
    transaction.execute(
        "INSERT INTO request_records VALUES (?1, ?2, ?3, ?4)",
        params![id, operation, hash, serde_json::to_string(result)?],
    )?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
struct StoredSendResult {
    message_id: String,
    message_seq: i64,
    event_seq: i64,
}

pub fn validate_list(request: &ChatListRequest) -> AppResult<()> {
    if request.limit == 0 || request.limit > PAGE_LIMIT {
        return Err(AppError::invalid("limit", "单页数量必须在 1～200 之间。"));
    }
    if [
        request.before_seq.is_some(),
        request.after_seq.is_some(),
        request.around_seq.is_some(),
    ]
    .into_iter()
    .filter(|value| *value)
    .count()
        > 1
    {
        return Err(AppError::invalid(
            "cursor",
            "before、after 和 around 分页方式不能同时使用。",
        ));
    }
    for value in [&request.before_seq, &request.after_seq, &request.around_seq]
        .into_iter()
        .flatten()
    {
        parse_counter(value, "cursor")?;
    }
    Ok(())
}

pub(crate) fn load_messages(conn: &Connection, sequences: &[i64]) -> AppResult<Vec<ChatMessage>> {
    let mut message_statement = conn.prepare("SELECT id, sender_id, created_at, state, quote_message_id, mention_all FROM messages WHERE seq = ?1")?;
    let mut parts_statement =
        conn.prepare("SELECT text FROM message_parts WHERE message_id = ?1 ORDER BY ordinal")?;
    let mut mentions_statement = conn.prepare(
        "SELECT target_participant_id FROM mentions WHERE message_id = ?1 ORDER BY ordinal",
    )?;
    sequences
        .iter()
        .map(|&seq| {
            let (id, sender_id, created_at, state, quote, mention_all): (
                String,
                String,
                i64,
                String,
                Option<String>,
                bool,
            ) = message_statement.query_row([seq], |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                ))
            })?;
            let parts = parts_statement
                .query_map([&id], |row| Ok(MessagePart::Text { text: row.get(0)? }))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            let mention_ids = mentions_statement
                .query_map([&id], |row| row.get(0))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            let state: MessageState = serde_json::from_value(serde_json::Value::String(state))?;
            Ok(ChatMessage {
                id,
                seq: seq.into(),
                sender_id,
                created_at,
                parts: if state == MessageState::Visible {
                    parts
                } else {
                    Vec::new()
                },
                state,
                quote_message_id: quote,
                mention_ids,
                mention_all,
            })
        })
        .collect()
}

pub(crate) fn resolve_quotes(
    conn: &Connection,
    room_id: &str,
    ids: &[String],
) -> AppResult<Vec<ChatMessage>> {
    if ids.len() > 32 {
        return Err(AppError::invalid("message_ids", "单次最多读取 32 条引用。"));
    }
    let mut seen = HashSet::new();
    let mut sequences = Vec::new();
    let mut statement =
        conn.prepare("SELECT seq FROM messages WHERE id=?1 AND room_id=?2 AND state='visible'")?;
    for id in ids {
        validate_id(id, "message_ids")?;
        if seen.insert(id)
            && let Some(seq) = statement
                .query_row(params![id, room_id], |row| row.get(0))
                .optional()?
        {
            sequences.push(seq);
        }
    }
    load_messages(conn, &sequences)
}

fn sequence_query(conn: &Connection, sql: &str, cursor: i64, limit: u32) -> AppResult<Vec<i64>> {
    let mut statement = conn.prepare(sql)?;
    Ok(statement
        .query_map(params![cursor, limit], |row| row.get(0))?
        .collect::<rusqlite::Result<Vec<_>>>()?)
}

pub(crate) fn validate_message_content(
    parts: &[MessagePart],
    quote: &Option<String>,
    mentions: &[String],
) -> AppResult<String> {
    if parts.is_empty() || parts.len() > 16 {
        return Err(AppError::invalid("parts", "消息需要 1～16 个文本部分。"));
    }
    let mut text = String::new();
    let mut characters = 0;
    for part in parts {
        let MessagePart::Text { text: value } = part else {
            return Err(AppError::new(
                ErrorCode::CapabilityUnsupported,
                "当前交付只支持文本消息，图片和表情附件尚未启用。",
            ));
        };
        characters += value.chars().count();
        if value.len() > TEXT_BYTE_LIMIT.saturating_sub(text.len())
            || characters > TEXT_CHARACTER_LIMIT
        {
            return Err(AppError::invalid(
                "parts",
                "消息超过 10000 个 Unicode 字符或 32KiB，请缩短后发送。",
            ));
        }
        text.push_str(value);
    }
    if text.trim().is_empty() {
        return Err(AppError::invalid("parts", "消息不能只有空白字符。"));
    }
    if mentions.len() > 32 {
        return Err(AppError::invalid("mention_ids", "单条消息的提及数量过多。"));
    }
    if let Some(id) = quote {
        validate_id(id, "quote_message_id")?;
    }
    for id in mentions {
        validate_id(id, "mention_ids")?;
    }
    Ok(text)
}

// Internal transaction helper only. The public user send path always supplies
// local_user_id; IPC cannot select a sender or a runtime decision.
#[allow(clippy::too_many_arguments)]
pub(crate) fn insert_message(
    transaction: &Transaction<'_>,
    generation: &str,
    room_id: &str,
    sender_id: &str,
    parts: &[MessagePart],
    quote: &Option<String>,
    mention_ids: &[String],
    mention_all: bool,
    text: &str,
) -> AppResult<(ChatSendResult, DomainEvent)> {
    if let Some(id) = quote {
        let visible: bool = transaction.query_row(
            "SELECT EXISTS(SELECT 1 FROM messages WHERE id=?1 AND room_id=?2 AND state='visible')",
            params![id, room_id],
            |row| row.get(0),
        )?;
        if !visible {
            return Err(AppError::new(
                ErrorCode::MessageNotFound,
                "被引用消息不存在或已失效，草稿未清除。",
            ));
        }
    }
    let owner: String = transaction.query_row(
        "SELECT r.owner_participant_id FROM room r JOIN participants p ON p.id = ?1 WHERE r.singleton = 1",
        [sender_id], |row| row.get(0),
    )?;
    if mention_all && owner != sender_id {
        return Err(AppError::new(
            ErrorCode::PermissionDenied,
            "只有当前群主可以结构化提及所有人。",
        ));
    }
    let mut mentions = mention_ids.to_vec();
    if mention_all {
        mentions = transaction
            .prepare("SELECT id FROM participants ORDER BY created_at, id")?
            .query_map([], |row| row.get(0))?
            .collect::<rusqlite::Result<Vec<_>>>()?;
    }
    let mut seen = HashSet::new();
    mentions.retain(|id| seen.insert(id.clone()));
    for id in &mentions {
        let exists: bool = transaction.query_row(
            "SELECT EXISTS(SELECT 1 FROM participants WHERE id = ?1)",
            [id],
            |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::invalid(
                "mention_ids",
                "被提及成员不存在，请重新选择。",
            ));
        }
    }
    let message_id = Uuid::now_v7().to_string();
    transaction.execute("INSERT INTO messages(id, room_id, sender_id, created_at, quote_message_id, mention_all) VALUES (?1, ?2, ?3, ?4, ?5, ?6)", params![message_id, room_id, sender_id, now_ms(), quote, mention_all])?;
    let message_seq = transaction.last_insert_rowid();
    transaction.execute(
        "INSERT INTO runtime_message_activity(message_seq,message_id,sender_id) VALUES (?1,?2,?3)",
        params![message_seq, message_id, sender_id],
    )?;
    for (ordinal, part) in parts.iter().enumerate() {
        if let MessagePart::Text { text } = part {
            transaction.execute(
                "INSERT INTO message_parts VALUES (?1, ?2, 'text', ?3)",
                params![message_id, ordinal as i64, text],
            )?;
        }
    }
    for (ordinal, id) in mentions.iter().enumerate() {
        transaction.execute(
            "INSERT INTO mentions VALUES (?1, ?2, ?3)",
            params![message_id, id, ordinal as i64],
        )?;
    }
    // trusted_schema=OFF requires updating FTS explicitly within this transaction.
    transaction.execute(
        "INSERT INTO search_text(seq, text) VALUES (?1, ?2)",
        params![message_seq, text],
    )?;
    transaction.execute(
        "INSERT INTO message_search(rowid, text) VALUES (?1, ?2)",
        params![message_seq, text],
    )?;
    let event = record_event(
        transaction,
        EventPayload::MessageCommitted {
            message_id: message_id.clone(),
            message_seq: message_seq.into(),
            sender_id: sender_id.to_owned(),
        },
        generation,
    )?;
    Ok((
        ChatSendResult {
            data_generation_id: generation.to_owned(),
            message_id,
            message_seq: message_seq.into(),
            event_seq: event.event_seq.clone(),
        },
        event,
    ))
}

/// 查询路径所在磁盘的总容量与卷标。无法获取时返回 (0, "")。
fn disk_capacity(path: &std::path::Path) -> (u64, String) {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        use windows_sys::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;

        let root = path.ancestors().find(|candidate| candidate.parent().is_none()).unwrap_or(path);
        let wide: Vec<u16> = root.as_os_str().encode_wide().chain(std::iter::once(0)).collect();
        let mut total = 0_u64;
        let ok = unsafe {
            GetDiskFreeSpaceExW(wide.as_ptr(), std::ptr::null_mut(), &mut total, std::ptr::null_mut())
        };
        if ok == 0 {
            return (0, String::new());
        }
        let letter = root.to_string_lossy().trim_end_matches('\\').to_string();
        (total, letter)
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = path;
        (0, String::new())
    }
}

impl Database {
    pub fn check_generation(&self, generation: &str) -> AppResult<()> {
        if generation != self.generation_id {
            return Err(AppError::new(
                ErrorCode::DataGenerationChanged,
                "数据运行世代已改变，请重新读取后再确认操作。",
            ));
        }
        Ok(())
    }

    pub fn snapshot(&mut self, request: AppSnapshotRequest) -> AppResult<AppSnapshot> {
        Ok(self.snapshot_with(request, |_| Ok(()))?.0)
    }

    pub(crate) fn snapshot_with<T>(
        &mut self,
        request: AppSnapshotRequest,
        read: impl FnOnce(&Connection) -> AppResult<T>,
    ) -> AppResult<(AppSnapshot, T)> {
        let generation = self.generation_id.clone();
        let user_id = self.local_user_id.clone();
        let data_directory = self.root.to_string_lossy().into_owned();
        let mut database_bytes = 0_i64;
        for name in ["chat.sqlite3", "chat.sqlite3-wal", "chat.sqlite3-shm"] {
            match std::fs::metadata(self.root.join(name)) {
                Ok(metadata) => {
                    let bytes: i64 = metadata.len().try_into().map_err(|_| {
                        AppError::new(ErrorCode::DataRootInvalid, "数据文件大小超出支持范围。")
                    })?;
                    database_bytes = database_bytes.checked_add(bytes).ok_or_else(|| {
                        AppError::new(ErrorCode::DataRootInvalid, "数据文件大小超出支持范围。")
                    })?;
                }
                Err(error)
                    if name != "chat.sqlite3" && error.kind() == std::io::ErrorKind::NotFound => {}
                Err(error) => return Err(error.into()),
            }
        }
        let avatar_bytes: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(byte_size),0) FROM avatar_objects",
            [],
            |row| row.get(0),
        )?;
        let (disk_total_bytes, disk_letter) = disk_capacity(&self.root);
        let data_usage = DataUsage {
            database_bytes: database_bytes.into(),
            avatar_bytes: avatar_bytes.into(),
            disk_total_bytes: (disk_total_bytes as i64).into(),
            disk_letter,
        };
        let after = request
            .last_event_seq
            .as_ref()
            .map(|value| parse_counter(value, "last_event_seq"))
            .transpose()?;
        let transaction = self.conn.transaction()?;
        let latest_message = allocated_seq(&transaction, "messages")?;
        let latest_event = allocated_seq(&transaction, "domain_events")?;
        let (id, name, owner, version, epoch) = transaction.query_row("SELECT id, name, owner_participant_id, version, content_epoch FROM room WHERE singleton = 1", [], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, row.get::<_, i64>(3)?, row.get::<_, i64>(4)?)))?;
        let participants = participants(&transaction)?;
        let local_user = participants
            .iter()
            .find(|participant| participant.id == user_id)
            .cloned()
            .ok_or_else(|| {
                AppError::new(
                    ErrorCode::DataRootInvalid,
                    "本地身份记录缺失，原数据已保留。",
                )
            })?;
        let mut requires_full_reload = request.data_generation_id.as_deref() != Some(&generation)
            || after.is_none()
            || after.is_some_and(|value| value > latest_event);
        let mut events = if requires_full_reload {
            Vec::new()
        } else {
            read_events(&transaction, after.unwrap_or(0), &generation)?
        };
        if events.len() > 512
            || (!requires_full_reload
                && latest_event > after.unwrap_or(0)
                && events.first().is_none_or(|event| {
                    parse_counter(&event.event_seq, "event_seq")
                        .map_or(true, |seq| seq > after.unwrap_or(0) + 1)
                }))
        {
            requires_full_reload = true;
            events.clear();
        }
        let appearance = read_appearance(&transaction)?;
        let extra = read(&transaction)?;
        transaction.commit()?;
        Ok((
            AppSnapshot {
                data_generation_id: generation,
                room: Room {
                    id,
                    name,
                    owner_participant_id: owner,
                    version: version.into(),
                    content_epoch: epoch.into(),
                },
                local_user,
                participants,
                appearance,
                latest_message_seq: latest_message.into(),
                latest_event_seq: latest_event.into(),
                events,
                requires_full_reload,
                data_directory,
                data_usage,
                // 版本只定义在根 package.json，由 scripts/sync-metadata.mjs 同步到 Cargo.toml。
                app_version: env!("CARGO_PKG_VERSION").to_owned(),
                development_tools_available: cfg!(debug_assertions),
            },
            extra,
        ))
    }

    pub fn send_message(
        &mut self,
        request: ChatSendRequest,
    ) -> AppResult<(ChatSendResult, Option<DomainEvent>)> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        let text = validate_message_content(
            &request.parts,
            &request.quote_message_id,
            &request.mention_ids,
        )?;
        let hash = fingerprint(&serde_json::to_vec(&(
            &request.parts,
            &request.quote_message_id,
            &request.mention_ids,
            request.mention_all,
        ))?);
        let generation = self.generation_id.clone();
        let user_id = self.local_user_id.clone();
        let room_id = self.room_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        if let Some(result) =
            replay_request(&transaction, &request.client_request_id, "chat_send", &hash)?
        {
            let result: StoredSendResult = serde_json::from_str(&result)?;
            return Ok((
                ChatSendResult {
                    data_generation_id: generation,
                    message_id: result.message_id,
                    message_seq: result.message_seq.into(),
                    event_seq: result.event_seq.into(),
                },
                None,
            ));
        }
        let recall_anchor = Instant::now();
        let (result, event) = insert_message(
            &transaction,
            &generation,
            &room_id,
            &user_id,
            &request.parts,
            &request.quote_message_id,
            &request.mention_ids,
            request.mention_all,
            &text,
        )?;
        let message_id = result.message_id;
        let message_seq = parse_counter(&result.message_seq, "message_seq")?;
        let event_seq = parse_counter(&event.event_seq, "event_seq")?;
        record_request(
            &transaction,
            &request.client_request_id,
            "chat_send",
            &hash,
            &StoredSendResult {
                message_id: message_id.clone(),
                message_seq,
                event_seq,
            },
        )?;
        transaction.commit()?;
        self.recall_anchors
            .retain(|_, anchor| anchor.elapsed() < RECALL_WINDOW);
        self.recall_anchors
            .insert(message_id.clone(), recall_anchor);
        Ok((
            ChatSendResult {
                data_generation_id: generation,
                message_id,
                message_seq: message_seq.into(),
                event_seq: event_seq.into(),
            },
            Some(event),
        ))
    }

    pub fn resolve_quotes(
        &mut self,
        request: ChatResolveQuotesRequest,
    ) -> AppResult<Vec<ChatMessage>> {
        self.check_generation(&request.data_generation_id)?;
        let transaction = self.conn.transaction()?;
        let messages = resolve_quotes(&transaction, &self.room_id, &request.message_ids)?;
        transaction.commit()?;
        Ok(messages)
    }

    pub fn recall_message(
        &mut self,
        request: ChatRecallRequest,
    ) -> AppResult<(ChatRecallResult, Option<DomainEvent>)> {
        self.recall_message_with_clock(request, Instant::now, None)
    }

    /// 智能体撤回自己刚发出的消息；仍受三分钟时限与来源校验约束。
    pub fn recall_agent_message(
        &mut self,
        agent_id: &str,
        message_id: &str,
        generation: &str,
    ) -> AppResult<Option<DomainEvent>> {
        validate_id(agent_id, "agent_id")?;
        let request = ChatRecallRequest {
            data_generation_id: generation.to_owned(),
            client_request_id: Uuid::now_v7().to_string(),
            message_id: message_id.to_owned(),
        };
        let (_, event) = self.recall_message_with_clock(request, Instant::now, Some(agent_id))?;
        Ok(event)
    }

    #[cfg(test)]
    pub(crate) fn recall_message_at(
        &mut self,
        request: ChatRecallRequest,
        now: Instant,
    ) -> AppResult<(ChatRecallResult, Option<DomainEvent>)> {
        self.recall_message_with_clock(request, || now, None)
    }

    fn recall_message_with_clock(
        &mut self,
        request: ChatRecallRequest,
        clock: impl FnOnce() -> Instant,
        expected_agent: Option<&str>,
    ) -> AppResult<(ChatRecallResult, Option<DomainEvent>)> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        validate_id(&request.message_id, "message_id")?;
        let generation = self.generation_id.clone();
        let hash = fingerprint(request.message_id.as_bytes());
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        if let Some(result) = replay_request(
            &transaction,
            &request.client_request_id,
            "chat_recall",
            &hash,
        )? {
            let mut result: ChatRecallResult = serde_json::from_str(&result)?;
            result.data_generation_id = generation;
            return Ok((result, None));
        }
        let message: Option<(i64, String, String)> = transaction
            .query_row(
                "SELECT seq,sender_id,state FROM messages WHERE id=?1 AND room_id=?2",
                params![request.message_id, self.room_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()?;
        let Some((seq, sender_id, state)) = message else {
            return Err(AppError::new(ErrorCode::MessageNotFound, "消息已不存在。"));
        };
        let allowed = match expected_agent {
            Some(agent_id) => sender_id == agent_id,
            None => sender_id == self.local_user_id,
        };
        if !allowed {
            return Err(AppError::new(
                ErrorCode::PermissionDenied,
                "只能撤回自己发送的消息。",
            ));
        }
        if state != "visible" {
            return Err(AppError::new(
                ErrorCode::MessageNotFound,
                "这条消息已撤回或删除。",
            ));
        }
        // 重启后没有可靠的单调时间锚，旧消息不能重新获得撤回期限。
        let now = clock();
        let eligible = self
            .recall_anchors
            .get(&request.message_id)
            .and_then(|anchor| now.checked_duration_since(*anchor))
            .is_some_and(|elapsed| elapsed < RECALL_WINDOW);
        if !eligible {
            return Err(AppError::new(
                ErrorCode::PermissionDenied,
                "这条消息已超过可撤回期限，或发送于上次运行。",
            ));
        }
        let text: Option<String> = transaction
            .query_row("SELECT text FROM search_text WHERE seq=?1", [seq], |row| {
                row.get(0)
            })
            .optional()?;
        if let Some(text) = text {
            transaction.execute(
                "INSERT INTO message_search(message_search,rowid,text) VALUES ('delete',?1,?2)",
                params![seq, text],
            )?;
            transaction.execute("DELETE FROM search_text WHERE seq=?1", [seq])?;
        }
        transaction.execute(
            "DELETE FROM message_parts WHERE message_id=?1",
            [&request.message_id],
        )?;
        transaction.execute(
            "DELETE FROM mentions WHERE message_id=?1",
            [&request.message_id],
        )?;
        transaction.execute(
            "UPDATE messages SET state='recalled',quote_message_id=NULL,mention_all=0 WHERE id=?1",
            [&request.message_id],
        )?;
        let (id, name, owner, version, epoch): (String, String, String, i64, i64) = transaction.query_row(
            "SELECT id,name,owner_participant_id,version,content_epoch FROM room WHERE singleton=1", [],
            |row| Ok((row.get(0)?,row.get(1)?,row.get(2)?,row.get(3)?,row.get(4)?)),
        )?;
        let next_epoch = epoch
            .checked_add(1)
            .ok_or_else(|| AppError::new(ErrorCode::DataRootInvalid, "聊天内容版本已达到上限。"))?;
        transaction.execute(
            "UPDATE room SET content_epoch=?1 WHERE singleton=1",
            [next_epoch],
        )?;
        let room = Room {
            id,
            name,
            owner_participant_id: owner,
            version: version.into(),
            content_epoch: next_epoch.into(),
        };
        let event = record_event(
            &transaction,
            EventPayload::MessageChanged {
                message_id: request.message_id.clone(),
                message_seq: seq.into(),
                room: room.clone(),
            },
            &generation,
        )?;
        let result = ChatRecallResult {
            data_generation_id: generation,
            message_id: request.message_id.clone(),
            event_seq: event.event_seq.clone(),
            room,
        };
        record_request(
            &transaction,
            &request.client_request_id,
            "chat_recall",
            &hash,
            &result,
        )?;
        transaction.commit()?;
        self.recall_anchors.remove(&request.message_id);
        Ok((result, Some(event)))
    }

    pub fn list_messages(&mut self, request: ChatListRequest) -> AppResult<MessagePage> {
        self.check_generation(&request.data_generation_id)?;
        validate_list(&request)?;
        let transaction = self.conn.transaction()?;
        let latest_message = allocated_seq(&transaction, "messages")?;
        for cursor in [&request.before_seq, &request.after_seq]
            .into_iter()
            .flatten()
        {
            if parse_counter(cursor, "cursor")? > latest_message {
                return Err(AppError::invalid("cursor", "分页游标超出当前消息范围。"));
            }
        }
        if request
            .before_seq
            .as_ref()
            .is_some_and(|cursor| cursor.0 == "0")
        {
            return Err(AppError::invalid(
                "before_seq",
                "向前分页需要一个有效的正消息序号。",
            ));
        }
        let mut sequences = if let Some(cursor) = &request.before_seq {
            let mut rows = sequence_query(
                &transaction,
                "SELECT seq FROM messages WHERE seq < ?1 ORDER BY seq DESC LIMIT ?2",
                parse_counter(cursor, "before_seq")?,
                request.limit,
            )?;
            rows.reverse();
            rows
        } else if let Some(cursor) = &request.after_seq {
            sequence_query(
                &transaction,
                "SELECT seq FROM messages WHERE seq > ?1 ORDER BY seq LIMIT ?2",
                parse_counter(cursor, "after_seq")?,
                request.limit,
            )?
        } else if let Some(cursor) = &request.around_seq {
            let seq = parse_counter(cursor, "around_seq")?;
            let exists: bool = transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM messages WHERE seq = ?1)",
                [seq],
                |row| row.get(0),
            )?;
            if !exists {
                return Err(AppError::new(
                    ErrorCode::MessageNotFound,
                    "定位的消息已不存在，未跳转到其他消息。",
                ));
            }
            let mut rows = sequence_query(
                &transaction,
                "SELECT seq FROM messages WHERE seq <= ?1 ORDER BY seq DESC LIMIT ?2",
                seq,
                request.limit / 2 + 1,
            )?;
            rows.reverse();
            rows.extend(sequence_query(
                &transaction,
                "SELECT seq FROM messages WHERE seq > ?1 ORDER BY seq LIMIT ?2",
                seq,
                request.limit.saturating_sub(rows.len() as u32),
            )?);
            rows
        } else {
            let mut rows = sequence_query(
                &transaction,
                "SELECT seq FROM messages WHERE seq <= ?1 ORDER BY seq DESC LIMIT ?2",
                i64::MAX,
                request.limit,
            )?;
            rows.reverse();
            rows
        };
        sequences.sort_unstable();
        let first = sequences.first().copied();
        let last = sequences.last().copied();
        let has_more_before = match first {
            Some(seq) => transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM messages WHERE seq < ?1)",
                [seq],
                |row| row.get(0),
            )?,
            None => false,
        };
        let has_more_after = match last {
            Some(seq) => transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM messages WHERE seq > ?1)",
                [seq],
                |row| row.get(0),
            )?,
            None => false,
        };
        let items = load_messages(&transaction, &sequences)?;
        let latest_event = allocated_seq(&transaction, "domain_events")?;
        transaction.commit()?;
        Ok(MessagePage {
            data_generation_id: self.generation_id.clone(),
            items,
            first_seq: first.map(Into::into),
            last_seq: last.map(Into::into),
            has_more_before,
            has_more_after,
            latest_message_seq: latest_message.into(),
            latest_event_seq: latest_event.into(),
        })
    }

    pub fn save_room(
        &mut self,
        request: RoomSaveRequest,
    ) -> AppResult<(Room, Option<DomainEvent>)> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        Uuid::parse_str(&request.client_request_id)
            .map_err(|_| AppError::invalid("client_request_id", "请求标识必须是有效的 UUID。"))?;
        let name = request.name.trim().to_owned();
        if name.is_empty() || name.chars().count() > 80 || name.contains('\0') {
            return Err(AppError::invalid(
                "name",
                "群名称不能为空、超过 80 个字符或含无效字符。",
            ));
        }
        let expected = parse_counter(&request.expected_version, "expected_version")?;
        let hash = fingerprint(&serde_json::to_vec(&(&request.expected_version, &name))?);
        let generation = self.generation_id.clone();
        let user_id = self.local_user_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let (id, owner, epoch) = transaction.query_row(
            "SELECT id, owner_participant_id, content_epoch FROM room WHERE singleton = 1",
            [],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, i64>(2)?,
                ))
            },
        )?;
        if owner != user_id {
            return Err(AppError::new(
                ErrorCode::PermissionDenied,
                "只有群主可以修改群名称。",
            ));
        }
        if let Some(result) =
            replay_request(&transaction, &request.client_request_id, "room_save", &hash)?
        {
            return Ok((serde_json::from_str(&result)?, None));
        }
        let next_version = expected
            .checked_add(1)
            .ok_or_else(|| AppError::invalid("expected_version", "群资料版本已达到数据库上限。"))?;
        let changed = transaction.execute(
            "UPDATE room SET name = ?1, version = ?2 WHERE singleton = 1 AND version = ?3 AND owner_participant_id = ?4",
            params![name, next_version, expected, user_id],
        )?;
        if changed != 1 {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "群资料已改变，编辑内容已保留，请重新读取。",
            ));
        }
        let room = Room {
            id,
            name,
            owner_participant_id: owner,
            version: next_version.into(),
            content_epoch: epoch.into(),
        };
        let event = record_event(
            &transaction,
            EventPayload::RoomChanged { room: room.clone() },
            &generation,
        )?;
        record_request(
            &transaction,
            &request.client_request_id,
            "room_save",
            &hash,
            &room,
        )?;
        transaction.commit()?;
        Ok((room, Some(event)))
    }

    pub fn save_appearance(
        &mut self,
        request: AppearanceSaveRequest,
    ) -> AppResult<(Appearance, Option<DomainEvent>)> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        let revision = parse_counter(&request.expected_revision, "expected_revision")?;
        let hash = fingerprint(&serde_json::to_vec(&(
            &request.expected_revision,
            &request.theme,
            request.reduce_motion,
        ))?);
        let generation = self.generation_id.clone();
        let transaction = self
            .conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        if let Some(result) = replay_request(
            &transaction,
            &request.client_request_id,
            "appearance_save",
            &hash,
        )? {
            return Ok((serde_json::from_str(&result)?, None));
        }
        let theme = serde_json::to_value(&request.theme)?;
        let changed = transaction.execute("UPDATE app_settings SET theme = ?1, reduce_motion = ?2, revision = revision + 1 WHERE singleton = 1 AND revision = ?3", params![theme.as_str(), request.reduce_motion, revision])?;
        if changed != 1 {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "外观设置已改变，请重新读取后保存。",
            ));
        }
        let appearance = read_appearance(&transaction)?;
        let event = record_event(
            &transaction,
            EventPayload::AppearanceChanged {
                appearance: appearance.clone(),
            },
            &generation,
        )?;
        record_request(
            &transaction,
            &request.client_request_id,
            "appearance_save",
            &hash,
            &appearance,
        )?;
        transaction.commit()?;
        Ok((appearance, Some(event)))
    }
}
