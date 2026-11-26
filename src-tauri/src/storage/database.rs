use std::{
    collections::HashMap,
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    time::{Duration, Instant},
};

use rusqlite::{Connection, OpenFlags, config::DbConfig, params};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::domain::{
    contracts::{AppError, ErrorCode},
    error::{AppResult, now_ms},
};

pub const SCHEMA: &str = include_str!("schema.sql");
pub const CURRENT_SCHEMA: u32 = 7;

/// 从 `schema.sql` 里取出一条 DDL。
/// 迁移时必须用与建库完全一致的语句文本，`verify_database` 会逐字比较 sqlite_schema。
pub(crate) fn ddl(prefix: &str) -> AppResult<String> {
    let cleaned = SCHEMA
        .lines()
        .filter(|line| !line.trim_start().starts_with("--"))
        .collect::<Vec<_>>()
        .join("\n");
    cleaned
        .split(';')
        .map(str::trim)
        .find(|statement| {
            statement
                .to_ascii_uppercase()
                .starts_with(&prefix.to_ascii_uppercase())
        })
        .map(str::to_owned)
        .ok_or_else(|| {
            AppError::new(
                ErrorCode::InternalError,
                format!("schema.sql 缺少语句：{prefix}"),
            )
        })
}

pub struct Database {
    pub(crate) conn: Connection,
    pub(crate) root: PathBuf,
    pub(crate) generation_id: String,
    pub(crate) local_user_id: String,
    pub(crate) room_id: String,
    pub(crate) recall_anchors: HashMap<String, Instant>,
    _writer_lock: File,
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct DataManifest {
    format_version: u32,
    root_id: String,
    schema_version: u32,
}

pub fn configure_connection(conn: &Connection) -> AppResult<()> {
    conn.busy_timeout(Duration::from_millis(750))?;
    conn.pragma_update(None, "foreign_keys", true)?;
    conn.pragma_update(None, "trusted_schema", false)?;
    conn.pragma_update(None, "synchronous", "FULL")?;
    conn.set_db_config(DbConfig::SQLITE_DBCONFIG_DEFENSIVE, true)?;
    Ok(())
}

pub fn open_reader(path: &Path) -> AppResult<Connection> {
    let conn = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )?;
    configure_connection(&conn)?;
    Ok(conn)
}

pub fn fingerprint(value: &[u8]) -> String {
    Sha256::digest(value)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

type SchemaRow = (String, String, String, Option<String>);

fn schema_rows(conn: &Connection) -> AppResult<Vec<SchemaRow>> {
    let mut statement = conn.prepare(
        "SELECT type, name, tbl_name, sql FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*' ORDER BY type, name",
    )?;
    let rows = statement.query_map([], |row| {
        Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
    })?;
    rows.collect::<rusqlite::Result<_>>().map_err(Into::into)
}

pub fn verify_database(conn: &Connection) -> AppResult<()> {
    let version: u32 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
    if version == 0 {
        return Err(AppError::new(
            ErrorCode::DataRootInvalid,
            "该目录没有可识别的 Sageroom 数据库，原文件已保留。",
        ));
    }
    if version != CURRENT_SCHEMA {
        return Err(AppError::new(
            ErrorCode::SchemaUnsupported,
            "当前仅支持最新首版数据。请确认后删除旧数据目录并重启应用；原文件未改动。",
        ));
    }
    let expected = Connection::open_in_memory()?;
    expected.execute_batch(SCHEMA)?;
    if schema_rows(conn)? != schema_rows(&expected)? {
        return Err(AppError::new(
            ErrorCode::DataRootInvalid,
            "数据库结构与最新首版设计不一致。请确认后删除旧数据目录并重启应用；原文件未改动。",
        ));
    }
    let (hash, metadata_version): (String, u32) = conn.query_row(
        "SELECT schema_hash, schema_version FROM app_meta WHERE singleton = 1",
        [],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;
    if hash != fingerprint(SCHEMA.as_bytes()) || metadata_version != CURRENT_SCHEMA {
        return Err(AppError::new(
            ErrorCode::SchemaUnsupported,
            "数据库版本校验与最新首版设计不一致。请确认后删除旧数据目录并重启应用；原文件未改动。",
        ));
    }
    let check: String = conn.query_row("PRAGMA quick_check", [], |row| row.get(0))?;
    if check != "ok" {
        return Err(AppError::new(
            ErrorCode::DbCorrupt,
            "数据库完整性检查失败，原文件已保留，请使用有效备份恢复。",
        ));
    }
    let mut statement = conn.prepare("PRAGMA foreign_key_check")?;
    if statement.query([])?.next()?.is_some() {
        return Err(AppError::new(
            ErrorCode::DbCorrupt,
            "数据库关联检查失败，原文件已保留。",
        ));
    }
    Ok(())
}

fn read_metadata<T: serde::de::DeserializeOwned>(path: &Path) -> AppResult<T> {
    let mut bytes = Vec::new();
    File::open(path)?.take(4097).read_to_end(&mut bytes)?;
    if bytes.len() > 4096 {
        return Err(AppError::new(
            ErrorCode::DataRootInvalid,
            "数据目录清单超过长度上限，原文件已保留。",
        ));
    }
    serde_json::from_slice(&bytes).map_err(|_| {
        AppError::new(
            ErrorCode::DataRootInvalid,
            "数据目录清单损坏，原文件已保留。",
        )
    })
}

fn write_metadata(path: &Path, value: &impl Serialize) -> AppResult<()> {
    let temporary = path.with_file_name(format!("metadata-{}.tmp", Uuid::now_v7()));
    let result: AppResult<()> = (|| {
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary)?;
        serde_json::to_writer(&mut file, value)?;
        file.flush()?;
        file.sync_all()?;
        fs::rename(&temporary, path)?;
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

fn write_manifest(root: &Path, root_id: &str) -> AppResult<()> {
    write_metadata(
        &root.join("data-manifest.json"),
        &DataManifest {
            format_version: 1,
            root_id: root_id.into(),
            schema_version: CURRENT_SCHEMA,
        },
    )
}

/// v6 → v7：消息从「纯文本」升级为「文本 + 附件」。
/// 只重建 `message_parts` 并新增附件表，其余表原地不动，用户历史消息不受影响。
fn migrate_schema(root: &Path, path: &Path) -> AppResult<()> {
    let root_id = {
        let conn = Connection::open(path)?;
        // 重建表期间不需要外键约束，收尾再用 quick_check 兜一次。
        conn.pragma_update(None, "foreign_keys", false)?;
        let version: u32 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
        if version == 0 || version >= CURRENT_SCHEMA {
            // 0 表示这不是一个 Sageroom 库，交给 verify_database 报错。
            return Ok(());
        }
        if version != 6 {
            return Err(AppError::new(
                ErrorCode::SchemaUnsupported,
                "该数据目录的版本过旧，无法就地升级。请备份后删除旧数据目录并重启应用；原文件未改动。",
            ));
        }
        let root_id: String = conn.query_row(
            "SELECT root_id FROM app_meta WHERE singleton=1",
            [],
            |row| row.get(0),
        )?;
        let transaction = conn.unchecked_transaction()?;
        transaction.execute_batch(&format!(
            "ALTER TABLE message_parts RENAME TO message_parts_v6;{};{}",
            ddl("CREATE TABLE attachment_objects")?,
            ddl("CREATE INDEX attachment_objects_message")?
        ))?;
        transaction.execute_batch(&format!("{};", ddl("CREATE TABLE message_parts")?))?;
        transaction.execute_batch(
            "INSERT INTO message_parts(message_id,ordinal,kind,text)
             SELECT message_id,ordinal,'text',text FROM message_parts_v6;
             DROP TABLE message_parts_v6;",
        )?;
        // app_meta 自带 `schema_version = 6` 的 CHECK，只能整表重建再灌新版本号。
        transaction.execute_batch(&format!(
            "ALTER TABLE app_meta RENAME TO app_meta_v6;{};",
            ddl("CREATE TABLE app_meta")?
        ))?;
        transaction.execute(
            "INSERT INTO app_meta(singleton,root_id,schema_version,schema_hash)
             SELECT singleton,root_id,?1,?2 FROM app_meta_v6",
            params![CURRENT_SCHEMA, fingerprint(SCHEMA.as_bytes())],
        )?;
        transaction.execute("DROP TABLE app_meta_v6", [])?;
        transaction.commit()?;
        conn.pragma_update(None, "user_version", CURRENT_SCHEMA)?;
        let ok: String = conn.query_row("PRAGMA quick_check", [], |row| row.get(0))?;
        if ok != "ok" {
            return Err(AppError::new(
                ErrorCode::DbCorrupt,
                "数据升级后完整性检查失败。",
            ));
        }
        root_id
    };
    // 清单里的版本号也要跟着走，否则 open 会判定清单与库不匹配。
    let manifest_path = root.join("data-manifest.json");
    if manifest_path.exists() {
        write_metadata(
            &manifest_path,
            &DataManifest {
                format_version: 1,
                root_id,
                schema_version: CURRENT_SCHEMA,
            },
        )?;
    }
    Ok(())
}

fn initialize_new_database(root: &Path, destination: &Path) -> AppResult<()> {
    let staging = root.join("staging");
    fs::create_dir_all(&staging)?;
    let operation = staging.join(format!("init-{}", Uuid::now_v7()));
    fs::create_dir(&operation)?;
    let candidate = operation.join(format!("chat-{}.sqlite3", Uuid::now_v7()));
    let result: AppResult<()> = (|| {
        let mut conn = Connection::open_with_flags(
            &candidate,
            OpenFlags::SQLITE_OPEN_READ_WRITE
                | OpenFlags::SQLITE_OPEN_CREATE
                | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )?;
        configure_connection(&conn)?;
        conn.pragma_update(None, "journal_mode", "DELETE")?;
        let transaction =
            conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        transaction.execute_batch(SCHEMA)?;
        let user_id = Uuid::now_v7().to_string();
        let room_id = Uuid::now_v7().to_string();
        transaction.execute(
            "INSERT INTO app_meta VALUES (1, ?1, ?2, ?3)",
            params![
                Uuid::now_v7().to_string(),
                CURRENT_SCHEMA,
                fingerprint(SCHEMA.as_bytes())
            ],
        )?;
        transaction.execute(
            "INSERT INTO participants(id,kind,display_name,status,builtin_key,created_at) VALUES (?1,'user','我','present',NULL,?2)",
            params![user_id, now_ms()],
        )?;
        for spec in super::configuration::default_agent_specs() {
            transaction.execute(
                "INSERT INTO participants(id,kind,display_name,status,builtin_key,created_at) VALUES (?1,'agent',?2,'needs_configuration',?3,?4)",
                params![Uuid::now_v7().to_string(), spec.display_name, spec.key, now_ms()],
            )?;
        }
        transaction.execute(
            "INSERT INTO room VALUES (1, ?1, 'Sageroom', ?2, 1, 0)",
            params![room_id, user_id],
        )?;
        transaction.execute("INSERT INTO app_settings VALUES (1, 'system', 0, 1)", [])?;
        super::configuration::seed_configuration(&transaction)?;
        transaction.execute(
            "INSERT INTO agent_runtime_states(agent_id,config_revision,status) SELECT agent_id,active_revision,'needs_configuration' FROM agent_configurations",
            [],
        )?;
        transaction.commit()?;
        verify_database(&conn)?;
        conn.close().map_err(|(_, error)| AppError::from(error))?;
        OpenOptions::new()
            .read(true)
            .write(true)
            .open(&candidate)?
            .sync_all()?;
        if destination.exists() {
            return Err(AppError::new(
                ErrorCode::DataRootInvalid,
                "正式数据库已存在，未覆盖原文件。",
            ));
        }
        fs::rename(&candidate, destination)?;
        Ok(())
    })();
    // 此目录由本次操作独占创建，失败清理不会触及既有库或其他暂存。
    let _ = fs::remove_dir_all(&operation);
    result
}

impl Database {
    pub fn open(root: &Path, generation_id: String) -> AppResult<Self> {
        fs::create_dir_all(root)?;
        let writer_lock = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(root.join("writer.lock"))?;
        match writer_lock.try_lock() {
            Ok(()) => {}
            Err(std::fs::TryLockError::WouldBlock) => {
                return Err(AppError::new(
                    ErrorCode::DbBusy,
                    "此数据目录已由其他 Sageroom 实例使用。",
                ));
            }
            Err(std::fs::TryLockError::Error(error)) => return Err(error.into()),
        }

        let path = root.join("chat.sqlite3");
        let manifest_path = root.join("data-manifest.json");
        if !path.exists() && manifest_path.exists() {
            return Err(AppError::new(
                ErrorCode::DataRootInvalid,
                "既有数据目录的聊天数据库缺失，未创建空库，请检查原目录或备份。",
            ));
        }
        if !path.exists() {
            initialize_new_database(root, &path)?;
        } else {
            migrate_schema(root, &path)?;
        }
        let candidate = open_reader(&path)?;
        verify_database(&candidate)?;
        let root_id: String = candidate.query_row(
            "SELECT root_id FROM app_meta WHERE singleton=1",
            [],
            |row| row.get(0),
        )?;
        let manifest: Option<DataManifest> = if manifest_path.exists() {
            Some(read_metadata(&manifest_path)?)
        } else {
            None
        };
        if let Some(manifest) = &manifest {
            if manifest.format_version != 1
                || manifest.root_id != root_id
                || manifest.schema_version != CURRENT_SCHEMA
            {
                return Err(AppError::new(
                    ErrorCode::DataRootInvalid,
                    "数据目录清单与数据库不匹配，未切换或覆盖原数据。",
                ));
            }
        }
        drop(candidate);
        let conn = Connection::open_with_flags(
            &path,
            OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )?;
        configure_connection(&conn)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        if manifest.is_none() {
            write_manifest(root, &root_id)?;
        }
        conn.execute(
            "UPDATE agent_runtime_states SET status='offline', detail=NULL WHERE status IN ('deciding','waiting_to_send')",
            [],
        )?;
        let local_user_id = conn.query_row(
            "SELECT id FROM participants WHERE kind = 'user'",
            [],
            |row| row.get(0),
        )?;
        let room_id = conn.query_row("SELECT id FROM room WHERE singleton = 1", [], |row| {
            row.get(0)
        })?;
        let mut database = Self {
            conn,
            root: root.to_owned(),
            generation_id,
            local_user_id,
            room_id,
            recall_anchors: HashMap::new(),
            _writer_lock: writer_lock,
        };
        // 上次退出前没发出去的附件，超过保留期就丢掉；失败不影响启动。
        let _ = database.prune_staged_attachments();
        Ok(database)
    }
}
