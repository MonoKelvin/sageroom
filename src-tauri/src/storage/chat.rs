use std::collections::HashSet;

use rusqlite::{Connection, OptionalExtension, Transaction, params};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::{
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

fn participants(conn: &Connection) -> AppResult<Vec<Participant>> {
    let mut statement = conn.prepare("SELECT id, kind, display_name, introduction, status, builtin_key FROM participants ORDER BY kind DESC, created_at, id")?;
    let rows = statement.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, String>(4)?,
            row.get::<_, Option<String>>(5)?,
        ))
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>()?
        .into_iter()
        .map(|(id, kind, display_name, introduction, status, builtin)| {
            Ok(Participant {
                id,
                display_name,
                introduction,
                kind: serde_json::from_value(serde_json::Value::String(kind))?,
                status: serde_json::from_value(serde_json::Value::String(status))?,
                is_builtin: builtin.is_some(),
            })
        })
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

fn record_event(
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

fn replay_request(
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

fn record_request(
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

fn load_messages(conn: &Connection, sequences: &[i64]) -> AppResult<Vec<ChatMessage>> {
    let mut message_statement = conn.prepare("SELECT id, sender_id, sender_snapshot_json, created_at, state, quote_message_id, mention_all FROM messages WHERE seq = ?1")?;
    let mut parts_statement =
        conn.prepare("SELECT text FROM message_parts WHERE message_id = ?1 ORDER BY ordinal")?;
    let mut mentions_statement = conn.prepare(
        "SELECT target_participant_id FROM mentions WHERE message_id = ?1 ORDER BY ordinal",
    )?;
    sequences
        .iter()
        .map(|&seq| {
            let (id, sender_id, snapshot, created_at, state, quote, mention_all): (
                String,
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
                    row.get(6)?,
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
                sender_snapshot: serde_json::from_str(&snapshot)?,
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

fn sequence_query(conn: &Connection, sql: &str, cursor: i64, limit: u32) -> AppResult<Vec<i64>> {
    let mut statement = conn.prepare(sql)?;
    Ok(statement
        .query_map(params![cursor, limit], |row| row.get(0))?
        .collect::<rusqlite::Result<Vec<_>>>()?)
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
        let generation = self.generation_id.clone();
        let user_id = self.local_user_id.clone();
        let data_directory = self.root.to_string_lossy().into_owned();
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
        transaction.commit()?;
        Ok(AppSnapshot {
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
            app_version: env!("CARGO_PKG_VERSION").to_owned(),
        })
    }

    pub fn send_message(
        &mut self,
        request: ChatSendRequest,
    ) -> AppResult<(ChatSendResult, Option<DomainEvent>)> {
        self.check_generation(&request.data_generation_id)?;
        validate_id(&request.client_request_id, "client_request_id")?;
        if request.parts.is_empty() || request.parts.len() > 16 {
            return Err(AppError::invalid("parts", "消息需要 1～16 个文本部分。"));
        }
        let mut text = String::new();
        let mut characters = 0;
        for part in &request.parts {
            match part {
                MessagePart::Text { text: value } => {
                    if value.len() > TEXT_BYTE_LIMIT.saturating_sub(text.len()) {
                        return Err(AppError::invalid(
                            "parts",
                            "消息超过 10000 个 Unicode 字符或 32KiB，请缩短后发送。",
                        ));
                    }
                    characters += value.chars().count();
                    if characters > TEXT_CHARACTER_LIMIT {
                        return Err(AppError::invalid(
                            "parts",
                            "消息超过 10000 个 Unicode 字符或 32KiB，请缩短后发送。",
                        ));
                    }
                    text.push_str(value);
                }
                _ => {
                    return Err(AppError::new(
                        ErrorCode::CapabilityUnsupported,
                        "当前交付只支持文本消息，图片和表情附件尚未启用。",
                    ));
                }
            }
        }
        if text.trim().is_empty() {
            return Err(AppError::invalid("parts", "消息不能只有空白字符。"));
        }
        if request.mention_ids.len() > 32 {
            return Err(AppError::invalid("mention_ids", "单条消息的提及数量过多。"));
        }
        if let Some(id) = &request.quote_message_id {
            validate_id(id, "quote_message_id")?;
        }
        for id in &request.mention_ids {
            validate_id(id, "mention_ids")?;
        }
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
        if let Some(id) = &request.quote_message_id {
            let exists: bool = transaction.query_row(
                "SELECT EXISTS(SELECT 1 FROM messages WHERE id = ?1 AND room_id = ?2)",
                params![id, room_id],
                |row| row.get(0),
            )?;
            if !exists {
                return Err(AppError::new(
                    ErrorCode::MessageNotFound,
                    "被引用消息不存在，草稿未清除。",
                ));
            }
        }
        let (owner, display_name, kind): (String, String, String) = transaction.query_row(
            "SELECT r.owner_participant_id, p.display_name, p.kind FROM room r JOIN participants p ON p.id = ?1 WHERE r.singleton = 1",
            [&user_id], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )?;
        if request.mention_all && owner != user_id {
            return Err(AppError::new(
                ErrorCode::PermissionDenied,
                "只有当前群主可以结构化提及所有人。",
            ));
        }
        let mut mentions = request.mention_ids.clone();
        if request.mention_all {
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
        let snapshot = SenderSnapshot {
            display_name,
            kind: serde_json::from_value(serde_json::Value::String(kind))?,
        };
        let message_id = Uuid::now_v7().to_string();
        transaction.execute("INSERT INTO messages(id, room_id, sender_id, sender_snapshot_json, created_at, quote_message_id, mention_all) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)", params![message_id, room_id, user_id, serde_json::to_string(&snapshot)?, now_ms(), request.quote_message_id, request.mention_all])?;
        let message_seq = transaction.last_insert_rowid();
        for (ordinal, part) in request.parts.iter().enumerate() {
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
        // trusted_schema=OFF 时不用触发器写 FTS，正文与索引仍在同一事务。
        transaction.execute(
            "INSERT INTO search_text(seq, text) VALUES (?1, ?2)",
            params![message_seq, text],
        )?;
        transaction.execute(
            "INSERT INTO message_search(rowid, text) VALUES (?1, ?2)",
            params![message_seq, text],
        )?;
        let event = record_event(
            &transaction,
            EventPayload::MessageCommitted {
                message_id: message_id.clone(),
                message_seq: message_seq.into(),
                sender_id: user_id,
            },
            &generation,
        )?;
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
