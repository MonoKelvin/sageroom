//! 消息附件（图片与文件）的落地存储。
//!
//! 设计要点：
//! - 原始字节原样落盘，不做重编码，保留动图与原始画质；
//! - 类型判定只看魔数，不看扩展名，避免把 exe 改名成 png 就冒充图片；
//! - 上传后先以「暂存」状态入库（`message_id` 为空），发送成功才被消息认领，
//!   未发送的附件由 `discard` 或启动时的 `prune_staged` 清理，不留孤儿文件。

use std::{
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
};

use base64::{Engine, engine::general_purpose::STANDARD};
use rusqlite::{OptionalExtension, params};
use uuid::Uuid;

use crate::{
    domain::{
        contracts::{
            AppError, AttachmentData, AttachmentKind, AttachmentObject, ErrorCode,
        },
        error::{AppResult, now_ms},
    },
    storage::database::{Database, fingerprint},
};

/// 单个图片上限。超过就要求用户压缩后再发。
const IMAGE_LIMIT: u64 = 12 * 1024 * 1024;
/// 单个文件上限，与 `schema.sql` 里 `byte_size` 的 CHECK 保持一致。
const FILE_LIMIT: u64 = 25 * 1024 * 1024;
/// 附件目录整体预算，超出后拒绝新上传。
const DIRECTORY_BUDGET: i64 = 2 * 1024 * 1024 * 1024;
/// 暂存附件保留时长，超时未发送即清理。
const STAGING_TTL_MS: i64 = 24 * 60 * 60 * 1000;

pub struct IncomingAttachment {
    bytes: Vec<u8>,
    file_name: String,
    mime_type: String,
    kind: AttachmentKind,
    width: Option<u32>,
    height: Option<u32>,
    extension: String,
}

fn too_large(limit: u64) -> AppError {
    AppError::new(
        ErrorCode::InvalidInput,
        format!(
            "附件过大：图片上限 {}MiB，其他文件上限 {}MiB。",
            IMAGE_LIMIT / 1024 / 1024,
            limit / 1024 / 1024
        ),
    )
}

/// 只保留文件名本身：去掉目录、控制字符和 Windows 非法字符，限制长度。
pub fn sanitize_name(name: &str) -> String {
    let base = name
        .rsplit(['/', '\\'])
        .next()
        .unwrap_or(name)
        .chars()
        .filter(|c| !c.is_control() && !matches!(c, '<' | '>' | ':' | '"' | '|' | '?' | '*'))
        .take(120)
        .collect::<String>();
    let trimmed = base.trim().trim_matches('.').trim();
    if trimmed.is_empty() {
        "未命名文件".to_string()
    } else {
        trimmed.to_string()
    }
}

/// 用魔数判定真实类型，返回 (mime, 扩展名, 类别)。
fn sniff(bytes: &[u8]) -> (&'static str, &'static str, AttachmentKind) {
    const IMAGE: AttachmentKind = AttachmentKind::Image;
    const FILE: AttachmentKind = AttachmentKind::File;
    if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        ("image/png", "png", IMAGE)
    } else if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        ("image/jpeg", "jpg", IMAGE)
    } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        ("image/gif", "gif", IMAGE)
    } else if bytes.len() > 12 && bytes.starts_with(b"RIFF") && &bytes[8..12] == b"WEBP" {
        ("image/webp", "webp", IMAGE)
    } else if bytes.starts_with(b"BM") {
        ("image/bmp", "bmp", IMAGE)
    } else if bytes.len() > 12 && &bytes[4..8] == b"ftyp" && &bytes[8..12] == b"avif" {
        ("image/avif", "avif", IMAGE)
    } else if bytes.starts_with(b"%PDF-") {
        ("application/pdf", "pdf", FILE)
    } else if bytes.starts_with(b"PK\x03\x04") {
        ("application/zip", "zip", FILE)
    } else {
        ("application/octet-stream", "bin", FILE)
    }
}

/// 只读文件头拿图片尺寸，不解码像素，避免大图吃内存。
fn image_dimensions(bytes: &[u8], mime: &str) -> Option<(u32, u32)> {
    match mime {
        "image/png" => {
            if bytes.len() < 24 {
                return None;
            }
            let width = u32::from_be_bytes(bytes[16..20].try_into().ok()?);
            let height = u32::from_be_bytes(bytes[20..24].try_into().ok()?);
            (width > 0 && height > 0).then_some((width, height))
        }
        "image/gif" => {
            if bytes.len() < 10 {
                return None;
            }
            let width = u16::from_le_bytes(bytes[6..8].try_into().ok()?) as u32;
            let height = u16::from_le_bytes(bytes[8..10].try_into().ok()?) as u32;
            (width > 0 && height > 0).then_some((width, height))
        }
        // BMP 的高度可能是负数（自下而上存储），取绝对值。
        "image/bmp" => {
            if bytes.len() < 26 {
                return None;
            }
            let width = i32::from_le_bytes(bytes[18..22].try_into().ok()?);
            let height = i32::from_le_bytes(bytes[22..26].try_into().ok()?);
            (width > 0 && height != 0).then_some((width as u32, height.unsigned_abs()))
        }
        "image/jpeg" => {
            use image::ImageDecoder;
            let reader = image::ImageReader::with_format(
                std::io::Cursor::new(bytes),
                image::ImageFormat::Jpeg,
            );
            let decoder = reader.into_decoder().ok()?;
            let (width, height) = decoder.dimensions();
            (width > 0 && height > 0).then_some((width, height))
        }
        _ => None,
    }
}

pub fn prepare(file_name: &str, bytes: Vec<u8>) -> AppResult<IncomingAttachment> {
    let (mime_type, extension, kind) = sniff(&bytes);
    let limit = if kind == AttachmentKind::Image { IMAGE_LIMIT } else { FILE_LIMIT };
    if bytes.is_empty() || bytes.len() as u64 > limit {
        return Err(too_large(limit));
    }
    let (width, height) = image_dimensions(&bytes, mime_type)
        .map(|(w, h)| (Some(w), Some(h)))
        .unwrap_or((None, None));
    // 未知类型沿用用户给的扩展名，保证系统打开时能挑对程序。
    let extension = if extension == "bin" {
        extension_for_display(file_name).to_string()
    } else {
        extension.to_string()
    };
    Ok(IncomingAttachment {
        bytes,
        file_name: sanitize_name(file_name),
        mime_type: mime_type.to_string(),
        kind,
        width,
        height,
        extension,
    })
}

fn extension_for_display(name: &str) -> String {
    name.rsplit_once('.')
        .map(|(_, ext)| ext.to_ascii_lowercase())
        .filter(|ext| !ext.is_empty() && ext.len() <= 8 && ext.chars().all(|c| c.is_ascii_alphanumeric()))
        .unwrap_or_else(|| "bin".to_string())
}

pub fn read_selection(path: &Path) -> AppResult<IncomingAttachment> {
    let file = File::open(path)?;
    let metadata = file.metadata()?;
    if !metadata.is_file() || metadata.len() > FILE_LIMIT {
        return Err(too_large(FILE_LIMIT));
    }
    let name = path
        .file_name()
        .map(|value| value.to_string_lossy().into_owned())
        .unwrap_or_else(|| "未命名文件".into());
    let mut bytes = Vec::new();
    file.take(FILE_LIMIT + 1).read_to_end(&mut bytes)?;
    prepare(&name, bytes)
}

fn object_path(root: &Path, id: &str, extension: &str) -> AppResult<PathBuf> {
    if Uuid::parse_str(id).is_err() {
        return Err(AppError::invalid("attachment_id", "附件标识无效。"));
    }
    Ok(root.join("attachments").join(format!("{id}.{extension}")))
}

fn extension_of_relative(relative: &str) -> &str {
    relative.rsplit_once('.').map(|(_, ext)| ext).unwrap_or("bin")
}

impl Database {
    pub fn import_attachment(
        &mut self,
        generation: &str,
        incoming: IncomingAttachment,
    ) -> AppResult<AttachmentObject> {
        self.check_generation(generation)?;
        let occupied: i64 = self
            .conn
            .query_row("SELECT COALESCE(SUM(byte_size),0) FROM attachment_objects", [], |row| {
                row.get(0)
            })?;
        if occupied + incoming.bytes.len() as i64 > DIRECTORY_BUDGET {
            return Err(AppError::new(
                ErrorCode::Backpressure,
                "附件目录已达到 2GiB 本地预算，请清理后再上传。",
            ));
        }
        let id = Uuid::now_v7().to_string();
        let path = object_path(&self.root, &id, &incoming.extension)?;
        fs::create_dir_all(self.root.join("attachments"))?;
        let inside_root = path
            .parent()
            .ok_or_else(|| AppError::invalid("attachment", "附件路径无效。"))?
            .canonicalize()?
            .starts_with(self.root.canonicalize()?);
        if !inside_root {
            return Err(AppError::new(
                ErrorCode::DataRootInvalid,
                "附件目录超出当前数据根目录。",
            ));
        }
        let relative = format!("attachments/{id}.{}", incoming.extension);
        let mut file = OpenOptions::new().write(true).create_new(true).open(&path)?;
        let result = (|| {
            file.write_all(&incoming.bytes)?;
            file.sync_all()?;
            let transaction = self
                .conn
                .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
            transaction.execute(
                "INSERT INTO attachment_objects(id,relative_path,message_id,file_name,mime_type,byte_size,width,height,sha256,created_at)
                 VALUES (?1,?2,NULL,?3,?4,?5,?6,?7,?8,?9)",
                params![
                    id,
                    relative,
                    incoming.file_name,
                    incoming.mime_type,
                    incoming.bytes.len() as i64,
                    incoming.width,
                    incoming.height,
                    fingerprint(&incoming.bytes),
                    now_ms()
                ],
            )?;
            transaction.commit()?;
            Ok(AttachmentObject {
                id: id.clone(),
                file_name: incoming.file_name.clone(),
                mime_type: incoming.mime_type.clone(),
                byte_size: incoming.bytes.len() as u32,
                kind: incoming.kind.clone(),
                width: incoming.width,
                height: incoming.height,
            })
        })();
        drop(file);
        if result.is_err() {
            let _ = fs::remove_file(&path);
        }
        result
    }

    pub fn read_attachment(&self, generation: &str, id: &str) -> AppResult<AttachmentData> {
        self.check_generation(generation)?;
        let (relative, mime, byte_size, hash): (String, String, i64, String) = self
            .conn
            .query_row(
                "SELECT relative_path,mime_type,byte_size,sha256 FROM attachment_objects WHERE id=?1",
                [id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
            )
            .map_err(|error| match error {
                rusqlite::Error::QueryReturnedNoRows => {
                    AppError::new(ErrorCode::MessageNotFound, "附件不存在或已被清理。")
                }
                other => other.into(),
            })?;
        let path = object_path(&self.root, id, extension_of_relative(&relative))?;
        if relative != format!("attachments/{id}.{}", extension_of_relative(&relative))
            || !(1..=FILE_LIMIT as i64).contains(&byte_size)
            || !path.canonicalize()?.starts_with(self.root.canonicalize()?)
        {
            return Err(AppError::new(
                ErrorCode::DataRootInvalid,
                "附件路径或大小无效。",
            ));
        }
        let file = File::open(&path)?;
        if !file.metadata()?.is_file() {
            return Err(AppError::new(ErrorCode::DataRootInvalid, "附件不是普通文件。"));
        }
        let mut bytes = Vec::new();
        file.take(FILE_LIMIT + 1).read_to_end(&mut bytes)?;
        if bytes.len() as i64 != byte_size || fingerprint(&bytes) != hash {
            return Err(AppError::new(
                ErrorCode::DbCorrupt,
                "附件完整性检查失败。",
            ));
        }
        Ok(AttachmentData {
            attachment_id: id.to_string(),
            mime_type: mime,
            data_base64: STANDARD.encode(bytes),
        })
    }

    /// 交给系统默认程序打开。返回磁盘路径，由命令层调用 ShellExecute。
    pub fn attachment_path(&self, generation: &str, id: &str) -> AppResult<PathBuf> {
        self.check_generation(generation)?;
        let relative: String = self
            .conn
            .query_row(
                "SELECT relative_path FROM attachment_objects WHERE id=?1",
                [id],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| AppError::new(ErrorCode::MessageNotFound, "附件不存在或已被清理。"))?;
        let path = object_path(&self.root, id, extension_of_relative(&relative))?;
        if !path.canonicalize()?.starts_with(self.root.canonicalize()?) {
            return Err(AppError::new(ErrorCode::DataRootInvalid, "附件路径无效。"));
        }
        Ok(path)
    }

    /// 撤回未发送的暂存附件，连同磁盘文件一起清理。
    pub fn discard_attachments(&mut self, generation: &str, ids: &[String]) -> AppResult<u32> {
        self.check_generation(generation)?;
        let mut discarded = 0;
        for id in ids.iter().take(32) {
            let Some(relative) = self
                .conn
                .query_row(
                    "SELECT relative_path FROM attachment_objects WHERE id=?1 AND message_id IS NULL",
                    [id],
                    |row| row.get::<_, String>(0),
                )
                .optional()?
            else {
                continue;
            };
            self.conn
                .execute("DELETE FROM attachment_objects WHERE id=?1 AND message_id IS NULL", [id])?;
            if let Ok(path) = object_path(&self.root, id, extension_of_relative(&relative)) {
                let _ = fs::remove_file(path);
            }
            discarded += 1;
        }
        Ok(discarded)
    }

    /// 启动时清理超时未发送的暂存附件。
    pub fn prune_staged_attachments(&mut self) -> AppResult<()> {
        let cutoff = now_ms() - STAGING_TTL_MS;
        let stale: Vec<(String, String)> = self
            .conn
            .prepare(
                "SELECT id,relative_path FROM attachment_objects WHERE message_id IS NULL AND created_at < ?1 LIMIT 512",
            )?
            .query_map([cutoff], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<rusqlite::Result<Vec<_>>>()?;
        for (id, relative) in stale {
            self.conn
                .execute("DELETE FROM attachment_objects WHERE id=?1 AND message_id IS NULL", [&id])?;
            if let Ok(path) = object_path(&self.root, &id, extension_of_relative(&relative)) {
                let _ = fs::remove_file(path);
            }
        }
        Ok(())
    }

}

/// 撤回发生在事务里，所以这里拿 `Connection` 而不是 `&mut Database`。
pub(crate) fn drop_message_attachments_in(
    conn: &rusqlite::Connection,
    root: &Path,
    message_id: &str,
) -> AppResult<()> {
    let rows: Vec<(String, String)> = conn
        .prepare("SELECT id,relative_path FROM attachment_objects WHERE message_id=?1")?
        .query_map([message_id], |row| Ok((row.get(0)?, row.get(1)?)))?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    for (id, relative) in rows {
        if let Ok(path) = object_path(root, &id, extension_of_relative(&relative)) {
            let _ = fs::remove_file(path);
        }
    }
    conn.execute("DELETE FROM attachment_objects WHERE message_id=?1", [message_id])?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::contracts::{ChatListRequest, ChatRecallRequest, ChatSendRequest, MessagePart};
    use tempfile::TempDir;

    fn png(width: u32, height: u32) -> Vec<u8> {
        let mut bytes = Vec::new();
        image::DynamicImage::new_rgb8(width, height)
            .write_to(&mut std::io::Cursor::new(&mut bytes), image::ImageFormat::Png)
            .unwrap();
        bytes
    }

    #[test]
    fn type_is_decided_by_magic_bytes_not_by_name() {
        let image = prepare("再说.png", png(40, 20)).unwrap();
        assert_eq!(image.kind, AttachmentKind::Image);
        assert_eq!((image.width, image.height), (Some(40), Some(20)));
        assert_eq!(image.extension, "png");

        // 名字伪装成图片，实际不是：按普通文件处理，不给图片渲染机会。
        let fake = prepare("伪装.png", b"MZ\x90\x00fake".to_vec()).unwrap();
        assert_eq!(fake.kind, AttachmentKind::File);
        assert_eq!(fake.mime_type, "application/octet-stream");

        assert!(prepare("empty.png", Vec::new()).is_err());
        assert!(prepare("big.bin", vec![0; FILE_LIMIT as usize + 1]).is_err());
    }

    #[test]
    fn names_are_sanitized_to_a_bare_file_name() {
        assert_eq!(sanitize_name("../../etc/passwd"), "passwd");
        assert_eq!(sanitize_name(r"C:\Users\a\b.txt"), "b.txt");
        assert_eq!(sanitize_name("   "), "未命名文件");
        assert_eq!(sanitize_name("a<b>c:d.png"), "abcd.png");
    }

    #[test]
    fn attachment_round_trip_and_recall_cleanup() {
        let directory = TempDir::new().unwrap();
        let mut database = Database::open(directory.path(), "attachments".into()).unwrap();
        let object = database
            .import_attachment(
                "attachments",
                prepare("照片.png", png(64, 48)).unwrap(),
            )
            .unwrap();
        assert_eq!(object.file_name, "照片.png");
        assert_eq!(object.byte_size as usize, png(64, 48).len());

        let result = database
            .send_message(ChatSendRequest {
                data_generation_id: "attachments".into(),
                client_request_id: "with-attachment".into(),
                parts: vec![
                    MessagePart::Attachment { attachment: object.clone() },
                    MessagePart::Text { text: "看这个".into() },
                ],
                quote_message_id: None,
                mention_ids: Vec::new(),
                mention_all: false,
            })
            .unwrap()
            .0;

        let page = database
            .list_messages(ChatListRequest {
                data_generation_id: "attachments".into(),
                before_seq: None,
                after_seq: None,
                around_seq: None,
                limit: 20,
            })
            .unwrap();
        let message = page.items.iter().find(|item| item.id == result.message_id).unwrap();
        assert_eq!(message.parts.len(), 2);
        match &message.parts[0] {
            MessagePart::Attachment { attachment } => {
                assert_eq!(attachment.file_name, "照片.png");
                assert_eq!(attachment.kind, AttachmentKind::Image);
                assert_eq!((attachment.width, attachment.height), (Some(64), Some(48)));
            }
            other => panic!("首个片段应为附件：{other:?}"),
        }
        assert!(matches!(&message.parts[1], MessagePart::Text { text } if text == "看这个"));

        let data = database.read_attachment("attachments", &object.id).unwrap();
        assert_eq!(data.mime_type, "image/png");

        // 撤回后附件行与磁盘文件都要消失。
        database
            .recall_message(ChatRecallRequest {
                data_generation_id: "attachments".into(),
                client_request_id: "recall-attachment".into(),
                message_id: result.message_id.clone(),
            })
            .unwrap();
        assert!(database.read_attachment("attachments", &object.id).is_err());
        assert_eq!(fs::read_dir(directory.path().join("attachments")).unwrap().count(), 0);
    }

    #[test]
    fn staged_attachment_cannot_be_claimed_twice() {
        let directory = TempDir::new().unwrap();
        let mut database = Database::open(directory.path(), "attachments".into()).unwrap();
        let object = database
            .import_attachment("attachments", prepare("a.png", png(8, 8)).unwrap())
            .unwrap();
        let request = |id: &str| ChatSendRequest {
            data_generation_id: "attachments".into(),
            client_request_id: id.into(),
            parts: vec![MessagePart::Attachment { attachment: object.clone() }],
            quote_message_id: None,
            mention_ids: Vec::new(),
            mention_all: false,
        };
        assert!(database.send_message(request("first")).is_ok());
        assert!(database.send_message(request("second")).is_err());
    }

    #[test]
    fn discard_removes_only_unclaimed_staged_objects() {
        let directory = TempDir::new().unwrap();
        let mut database = Database::open(directory.path(), "attachments".into()).unwrap();
        let staged = database
            .import_attachment("attachments", prepare("drop.png", png(8, 8)).unwrap())
            .unwrap();
        assert_eq!(
            database
                .discard_attachments("attachments", std::slice::from_ref(&staged.id))
                .unwrap(),
            1
        );
        assert!(database.read_attachment("attachments", &staged.id).is_err());
    }
}

/// 附件命令必须同时出现在三处才能被前端调用：
/// 构建期清单（build.rs）、handler 注册（lib.rs）、权限声明（permissions + capabilities）。
/// 少任何一处，界面都会报「Command not found / not allowed」，所以这里钉死。
#[cfg(test)]
mod wiring_tests {
    const COMMANDS: [&str; 5] = [
        "attachment_pick",
        "attachment_paste",
        "attachment_read",
        "attachment_open",
        "attachment_discard",
    ];

    #[test]
    fn attachment_commands_are_manifested_handled_and_granted() {
        let manifest = include_str!("../../build.rs");
        let handlers = include_str!("../lib.rs");
        let permissions = include_str!("../../permissions/app.toml");
        let capability: serde_json::Value =
            serde_json::from_str(include_str!("../../capabilities/main.json")).unwrap();
        for command in COMMANDS {
            assert!(manifest.contains(&format!("\"{command}\"")), "命令必须进入 AppManifest：{command}");
            assert!(handlers.contains(&format!("app::commands::{command}")), "命令必须注册 handler：{command}");
            assert!(permissions.contains(&format!("\"{command}\"")), "命令必须获得权限：{command}");
        }
        let granted = capability["permissions"].as_array().unwrap();
        assert!(
            granted.iter().any(|value| value.as_str() == Some("attachment-manage")),
            "主窗口必须授予 attachment-manage"
        );
    }
}
