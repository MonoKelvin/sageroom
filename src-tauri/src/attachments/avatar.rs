use std::{
    fs::{self, File, OpenOptions},
    io::{Cursor, Read, Write},
    path::{Path, PathBuf},
};

use base64::{Engine, engine::general_purpose::STANDARD};
use image::{DynamicImage, ImageDecoder, ImageFormat, ImageReader, Limits};
use rusqlite::params;
use uuid::Uuid;

use crate::{
    domain::{
        contracts::{AppError, AvatarData, AvatarObject, ErrorCode},
        error::AppResult,
    },
    storage::database::{Database, fingerprint},
};

const INPUT_LIMIT: u64 = 8 * 1024 * 1024;
const OBJECT_LIMIT: usize = 4 * 1024 * 1024;
const DIRECTORY_BUDGET: i64 = 256 * 1024 * 1024;

pub struct NormalizedAvatar {
    bytes: Vec<u8>,
    width: u32,
    height: u32,
}

fn invalid_image() -> AppError {
    AppError::invalid(
        "avatar",
        "请选择有效的 PNG/JPEG 图片，文件不超过 8MiB，尺寸不超过 4096×4096。",
    )
}

pub fn normalize(bytes: &[u8]) -> AppResult<NormalizedAvatar> {
    if bytes.len() as u64 > INPUT_LIMIT {
        return Err(invalid_image());
    }
    let format = image::guess_format(bytes).map_err(|_| invalid_image())?;
    if !matches!(format, ImageFormat::Png | ImageFormat::Jpeg) {
        return Err(invalid_image());
    }
    let mut reader = ImageReader::with_format(Cursor::new(bytes), format);
    let mut limits = Limits::default();
    limits.max_image_width = Some(4096);
    limits.max_image_height = Some(4096);
    limits.max_alloc = Some(96 * 1024 * 1024);
    reader.limits(limits);
    let decoder = reader.into_decoder().map_err(|_| invalid_image())?;
    let (width, height) = decoder.dimensions();
    if width == 0
        || height == 0
        || u64::from(width) * u64::from(height) > 16_777_216
        || decoder.total_bytes() > 64 * 1024 * 1024
    {
        return Err(invalid_image());
    }
    let image = DynamicImage::from_decoder(decoder)
        .map_err(|_| invalid_image())?
        .thumbnail(512, 512)
        .to_rgba8();
    let (width, height) = image.dimensions();
    let mut output = Cursor::new(Vec::new());
    DynamicImage::ImageRgba8(image)
        .write_to(&mut output, ImageFormat::Png)
        .map_err(|_| invalid_image())?;
    let bytes = output.into_inner();
    if bytes.is_empty() || bytes.len() > OBJECT_LIMIT {
        return Err(invalid_image());
    }
    Ok(NormalizedAvatar {
        bytes,
        width,
        height,
    })
}

pub fn read_selection(path: &Path) -> AppResult<NormalizedAvatar> {
    let file = File::open(path)?;
    let metadata = file.metadata()?;
    if !metadata.is_file() || metadata.len() > INPUT_LIMIT {
        return Err(invalid_image());
    }
    let mut bytes = Vec::new();
    file.take(INPUT_LIMIT + 1).read_to_end(&mut bytes)?;
    normalize(&bytes)
}

fn object_path(root: &Path, id: &str) -> AppResult<PathBuf> {
    if Uuid::parse_str(id).is_err() {
        return Err(AppError::invalid("avatar_id", "头像标识无效。"));
    }
    Ok(root.join("avatars").join(format!("{id}.png")))
}

impl Database {
    pub fn import_avatar(
        &mut self,
        generation: &str,
        image: NormalizedAvatar,
    ) -> AppResult<AvatarObject> {
        self.check_generation(generation)?;
        let occupied: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(byte_size),0) FROM avatar_objects",
            [],
            |row| row.get(0),
        )?;
        if occupied + image.bytes.len() as i64 > DIRECTORY_BUDGET {
            return Err(AppError::new(
                ErrorCode::Backpressure,
                "头像对象已达到 256MiB 本地预算，未写入新对象。",
            ));
        }
        let id = Uuid::now_v7().to_string();
        let path = object_path(&self.root, &id)?;
        fs::create_dir_all(self.root.join("avatars"))?;
        if !path
            .parent()
            .ok_or_else(invalid_image)?
            .canonicalize()?
            .starts_with(self.root.canonicalize()?)
        {
            return Err(AppError::new(
                ErrorCode::DataRootInvalid,
                "头像目录超出当前数据根目录。",
            ));
        }
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)?;
        let result = (|| {
            file.write_all(&image.bytes)?;
            file.sync_all()?;
            let transaction = self
                .conn
                .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
            transaction.execute(
                "INSERT INTO avatar_objects VALUES (?1,?2,'image/png',?3,?4,?5,?6)",
                params![
                    id,
                    format!("avatars/{id}.png"),
                    image.width,
                    image.height,
                    image.bytes.len() as i64,
                    fingerprint(&image.bytes)
                ],
            )?;
            transaction.commit()?;
            Ok(AvatarObject {
                id: id.clone(),
                mime_type: "image/png".into(),
                width: image.width,
                height: image.height,
                byte_size: image.bytes.len() as u32,
            })
        })();
        drop(file);
        if result.is_err() {
            let _ = fs::remove_file(&path);
        }
        result
    }

    pub fn read_avatar(&self, generation: &str, id: &str) -> AppResult<AvatarData> {
        self.check_generation(generation)?;
        let path = object_path(&self.root, id)?;
        let (relative, byte_size, hash): (String, i64, String) = self.conn.query_row(
            "SELECT relative_path,byte_size,sha256 FROM avatar_objects WHERE id=?1",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )?;
        if relative != format!("avatars/{id}.png")
            || !(1..=OBJECT_LIMIT as i64).contains(&byte_size)
            || !path.canonicalize()?.starts_with(self.root.canonicalize()?)
        {
            return Err(AppError::new(
                ErrorCode::DataRootInvalid,
                "头像对象路径或大小无效。",
            ));
        }
        let file = File::open(&path)?;
        if !file.metadata()?.is_file() {
            return Err(AppError::new(
                ErrorCode::DataRootInvalid,
                "头像对象不是普通文件。",
            ));
        }
        let mut bytes = Vec::new();
        file.take(OBJECT_LIMIT as u64 + 1).read_to_end(&mut bytes)?;
        if bytes.len() as i64 != byte_size
            || fingerprint(&bytes) != hash
            || image::guess_format(&bytes).ok() != Some(ImageFormat::Png)
        {
            return Err(AppError::new(
                ErrorCode::DbCorrupt,
                "头像对象完整性检查失败。",
            ));
        }
        Ok(AvatarData {
            avatar_id: id.into(),
            mime_type: "image/png".into(),
            data_base64: STANDARD.encode(bytes),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::contracts::{
        ChatListRequest, ChatSendRequest, MessagePart, UserProfileSaveRequest,
    };
    use tempfile::TempDir;

    fn image_bytes(format: ImageFormat) -> Vec<u8> {
        let mut output = Cursor::new(Vec::new());
        DynamicImage::new_rgb8(800, 600)
            .write_to(&mut output, format)
            .unwrap();
        output.into_inner()
    }

    #[test]
    fn png_and_jpeg_become_bounded_png_without_source_metadata() {
        for format in [ImageFormat::Png, ImageFormat::Jpeg] {
            let normalized = normalize(&image_bytes(format)).unwrap();
            assert_eq!((normalized.width, normalized.height), (512, 384));
            assert_eq!(
                image::guess_format(&normalized.bytes).unwrap(),
                ImageFormat::Png
            );
        }
        assert!(normalize(b"not an image").is_err());
        assert!(normalize(&vec![0; INPUT_LIMIT as usize + 1]).is_err());
    }

    #[test]
    fn excessive_dimensions_are_rejected_before_pixel_allocation() {
        let mut output = Cursor::new(Vec::new());
        DynamicImage::new_rgb8(4097, 1)
            .write_to(&mut output, ImageFormat::Png)
            .unwrap();
        assert!(normalize(&output.into_inner()).is_err());
    }

    #[test]
    fn failed_database_publish_removes_only_its_new_object() {
        let directory = TempDir::new().unwrap();
        let mut database = Database::open(directory.path(), "avatars".into()).unwrap();
        database.conn.execute_batch("CREATE TRIGGER reject_avatar BEFORE INSERT ON avatar_objects BEGIN SELECT RAISE(ABORT,'test'); END;").unwrap();
        assert!(
            database
                .import_avatar(
                    "avatars",
                    normalize(&image_bytes(ImageFormat::Png)).unwrap()
                )
                .is_err()
        );
        assert_eq!(
            fs::read_dir(directory.path().join("avatars"))
                .unwrap()
                .count(),
            0
        );
    }

    #[test]
    fn historical_sender_resolves_current_profile_after_avatar_changes() {
        let directory = TempDir::new().unwrap();
        let mut database = Database::open(directory.path(), "avatars".into()).unwrap();
        let avatar = database
            .import_avatar(
                "avatars",
                normalize(&image_bytes(ImageFormat::Png)).unwrap(),
            )
            .unwrap();
        database
            .save_user_profile(UserProfileSaveRequest {
                data_generation_id: "avatars".into(),
                client_request_id: "profile-avatar".into(),
                expected_revision: 1.into(),
                display_name: "原昵称".into(),
                introduction: String::new(),
                avatar_id: Some(avatar.id.clone()),
            })
            .unwrap();
        database
            .send_message(ChatSendRequest {
                data_generation_id: "avatars".into(),
                client_request_id: "avatar-message".into(),
                parts: vec![MessagePart::Text {
                    text: "历史".into(),
                }],
                quote_message_id: None,
                mention_ids: vec![],
                mention_all: false,
            })
            .unwrap();
        database
            .save_user_profile(UserProfileSaveRequest {
                data_generation_id: "avatars".into(),
                client_request_id: "profile-no-avatar".into(),
                expected_revision: 2.into(),
                display_name: "新昵称".into(),
                introduction: String::new(),
                avatar_id: None,
            })
            .unwrap();
        let page = database
            .list_messages(ChatListRequest {
                data_generation_id: "avatars".into(),
                before_seq: None,
                after_seq: None,
                around_seq: None,
                limit: 50,
            })
            .unwrap();
        let profile = database.get_user_profile("avatars").unwrap();
        assert_eq!(page.items[0].sender_id, profile.participant_id);
        assert_eq!(profile.display_name, "新昵称");
        assert_eq!(profile.avatar_id, None);
        assert!(database.read_avatar("avatars", &avatar.id).is_ok());
        assert!(database.read_avatar("wrong", &avatar.id).is_err());
        assert!(database.read_avatar("avatars", "../secrets").is_err());
    }
}
