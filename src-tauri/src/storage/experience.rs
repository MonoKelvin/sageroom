use std::{
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
};

use uuid::Uuid;

use crate::domain::{
    contracts::{AppError, ErrorCode, ExperienceEntry, TEXT_BYTE_LIMIT, TEXT_CHARACTER_LIMIT},
    error::{AppResult, now_ms, validate_id},
};

pub(crate) const MAX_ENTRIES: usize = 1000;
const MAX_FILE_BYTES: usize = 2 * 1024 * 1024;
pub(crate) const CONTEXT_ENTRIES: usize = 32;

/// 本地时区相对 UTC 的秒数。项目面向本地桌面场景，默认东八区。
/// 可通过 `SAGEROOM_TZ_OFFSET_SECONDS` 覆盖，便于其他地区使用。
fn timezone_offset_seconds() -> i64 {
    std::env::var("SAGEROOM_TZ_OFFSET_SECONDS")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(8 * 3600)
}

pub(crate) fn validate_entry(content: &str, score: u8) -> AppResult<()> {
    let trimmed = content.trim();
    if trimmed.is_empty()
        || trimmed.chars().count() > TEXT_CHARACTER_LIMIT
        || trimmed.len() > TEXT_BYTE_LIMIT
        || trimmed.contains('\n')
        || trimmed.contains('\r')
        || trimmed.contains('\0')
    {
        return Err(AppError::invalid("content", "经历内容为空、过长或含无效字符。"));
    }
    if score > 100 {
        return Err(AppError::invalid("score", "记忆评分必须在 0～100 之间。"));
    }
    Ok(())
}

pub(crate) fn validate_agent_id(agent_id: &str) -> AppResult<()> {
    validate_id(agent_id, "agent_id")?;
    let reserved = agent_id.to_ascii_uppercase();
    if !agent_id.bytes().all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
        || matches!(reserved.as_str(), "CON" | "PRN" | "AUX" | "NUL")
        || (reserved.len() == 4 && (reserved.starts_with("COM") || reserved.starts_with("LPT"))
            && matches!(reserved.as_bytes()[3], b'1'..=b'9'))
    {
        return Err(AppError::invalid("agent_id", "智能体数据目录标识无效。"));
    }
    Ok(())
}

fn checked_path(path: &Path, root: &Path, directory: bool) -> AppResult<()> {
    match fs::symlink_metadata(path) {
        Ok(metadata) => {
            if metadata.file_type().is_symlink()
                || metadata.is_dir() != directory
                || (!directory && !metadata.is_file())
                || !path.canonicalize()?.starts_with(root)
            {
                return Err(AppError::new(ErrorCode::DataRootInvalid, "经历文件路径无效，原文件已保留。"));
            }
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => return Err(error.into()),
    }
    Ok(())
}

fn agent_dir(root: &Path, agent_id: &str) -> AppResult<PathBuf> {
    validate_agent_id(agent_id)?;
    let root = root.canonicalize()?;
    let agents = root.join("agents");
    let directory = agents.join(agent_id);
    checked_path(&agents, &root, true)?;
    checked_path(&directory, &root, true)?;
    Ok(directory)
}

fn experience_path(root: &Path, agent_id: &str) -> AppResult<PathBuf> {
    let root = root.canonicalize()?;
    let path = agent_dir(&root, agent_id)?.join("experience.md");
    checked_path(&path, &root, false)?;
    Ok(path)
}

/// Unix 毫秒（本地偏移后）→ `YYYY/MM/DD HH:mm`，不依赖外部时间库。
fn format_timestamp(millis: i64) -> String {
    let seconds = millis.div_euclid(1000) + timezone_offset_seconds();
    let days = seconds.div_euclid(86_400);
    let seconds_of_day = seconds.rem_euclid(86_400);
    // Howard Hinnant 的 civil_from_days 算法，把 1970-01-01 作为纪元。
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let day_of_era = z - era * 146_097;
    let year_of_era = (day_of_era - day_of_era / 1460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let year = year_of_era + era * 400;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_prime = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
    let month = month_prime + if month_prime < 10 { 3 } else { -9 };
    let year = year + i64::from(month <= 2);
    let hour = seconds_of_day / 3600;
    let minute = (seconds_of_day % 3600) / 60;
    format!("{year:04}/{month:02}/{day:02} {hour:02}:{minute:02}")
}

fn entry_id(entry: &ExperienceEntry) -> String {
    super::database::fingerprint(serialize_entry(entry).as_bytes())
}

fn serialize_entry(entry: &ExperienceEntry) -> String {
    format!("{}  [{}] {}", entry.recorded_at, entry.score, entry.content)
}

fn parse_line(line: &str) -> Option<ExperienceEntry> {
    let (stamp, rest) = line.split_once("  [")?;
    let (score, content) = rest.split_once("] ")?;
    let score: u8 = score.parse().ok()?;
    if stamp.len() != 16 || !stamp.is_ascii()
        || stamp.as_bytes()[4] != b'/' || stamp.as_bytes()[7] != b'/'
        || stamp.as_bytes()[10] != b' ' || stamp.as_bytes()[13] != b':'
        || stamp.bytes().enumerate().any(|(index, byte)| !matches!(index, 4 | 7 | 10 | 13) && !byte.is_ascii_digit())
        || validate_entry(content, score).is_err()
    {
        return None;
    }
    let entry = ExperienceEntry {
        id: String::new(),
        recorded_at: stamp.to_owned(),
        score,
        content: content.trim().to_owned(),
    };
    Some(ExperienceEntry { id: entry_id(&entry), ..entry })
}

fn read_body(root: &Path, agent_id: &str) -> AppResult<Vec<u8>> {
    let path = experience_path(root, agent_id)?;
    let file = match File::open(path) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(error) => return Err(error.into()),
    };
    let mut bytes = Vec::new();
    file.take((MAX_FILE_BYTES + 1) as u64).read_to_end(&mut bytes)?;
    if bytes.len() > MAX_FILE_BYTES {
        return Err(AppError::new(ErrorCode::DataRootInvalid, "经历文件超过 2MiB，原文件已保留。"));
    }
    Ok(bytes)
}

pub(crate) fn read_snapshot(root: &Path, agent_id: &str) -> AppResult<(Vec<ExperienceEntry>, String)> {
    let bytes = read_body(root, agent_id)?;
    let revision = super::database::fingerprint(&bytes);
    let text = std::str::from_utf8(&bytes).map_err(|_| {
        AppError::new(ErrorCode::DataRootInvalid, "经历文件不是有效的 UTF-8 文本，原文件已保留。")
    })?;
    let mut entries = Vec::new();
    for line in text.lines().filter(|line| !line.trim().is_empty()) {
        if entries.len() >= MAX_ENTRIES {
            return Err(AppError::new(ErrorCode::DataRootInvalid, "经历条目超过上限，原文件已保留。"));
        }
        entries.push(parse_line(line).ok_or_else(|| {
            AppError::new(ErrorCode::DataRootInvalid, "经历文件格式无效，原文件已保留。")
        })?);
    }
    Ok((entries, revision))
}

fn write_entries(root: &Path, agent_id: &str, entries: &[ExperienceEntry]) -> AppResult<()> {
    write_entries_with(root, agent_id, entries, |temporary, path| {
        fs::rename(temporary, path).map_err(Into::into)
    })
}

fn write_entries_with(
    root: &Path,
    agent_id: &str,
    entries: &[ExperienceEntry],
    publish: impl FnOnce(&Path, &Path) -> AppResult<()>,
) -> AppResult<()> {
    let directory = agent_dir(root, agent_id)?;
    fs::create_dir_all(&directory)?;
    let path = experience_path(root, agent_id)?;
    if entries.len() > MAX_ENTRIES {
        return Err(AppError::invalid("content", "经历已达 1000 条，请先裁剪再添加。"));
    }
    let mut body = String::new();
    for entry in entries {
        validate_entry(&entry.content, entry.score)?;
        let line = serialize_entry(entry);
        if body.len() + line.len() + 1 > MAX_FILE_BYTES {
            return Err(AppError::invalid("content", "经历已达 2MiB，请先裁剪再添加。"));
        }
        body.push_str(&line);
        body.push('\n');
    }
    let temporary = directory.join(format!("experience-{}.tmp", Uuid::now_v7()));
    let result = (|| -> AppResult<()> {
        let mut file = OpenOptions::new().write(true).create_new(true).open(&temporary)?;
        file.write_all(body.as_bytes())?;
        file.flush()?;
        file.sync_all()?;
        drop(file);
        publish(&temporary, &path)?;
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

pub fn list(root: &Path, agent_id: &str) -> AppResult<Vec<ExperienceEntry>> {
    read_snapshot(root, agent_id).map(|(entries, _)| entries)
}

pub(crate) fn context_entries(mut entries: Vec<ExperienceEntry>) -> Vec<ExperienceEntry> {
    entries.sort_by(|left, right| right.score.cmp(&left.score).then_with(|| right.recorded_at.cmp(&left.recorded_at)));
    entries.truncate(CONTEXT_ENTRIES);
    entries
}

pub fn add(root: &Path, agent_id: &str, content: &str, score: u8) -> AppResult<ExperienceEntry> {
    add_checked(root, agent_id, content, score, || Ok(()))
}

pub(crate) fn add_checked(
    root: &Path,
    agent_id: &str,
    content: &str,
    score: u8,
    before_publish: impl FnOnce() -> AppResult<()>,
) -> AppResult<ExperienceEntry> {
    validate_entry(content, score)?;
    let mut entries = list(root, agent_id)?;
    let entry = ExperienceEntry {
        id: String::new(),
        recorded_at: format_timestamp(now_ms()),
        score,
        content: content.trim().to_owned(),
    };
    let entry = ExperienceEntry { id: entry_id(&entry), ..entry };
    if let Some(existing) = entries.iter().find(|existing| existing.id == entry.id) {
        return Ok(existing.clone());
    }
    entries.push(entry.clone());
    write_entries_with(root, agent_id, &entries, |temporary, path| {
        before_publish()?;
        fs::rename(temporary, path).map_err(Into::into)
    })?;
    Ok(entry)
}

pub fn delete(root: &Path, agent_id: &str, entry_id: &str) -> AppResult<Vec<ExperienceEntry>> {
    let mut entries = list(root, agent_id)?;
    let before = entries.len();
    entries.retain(|entry| entry.id != entry_id);
    if entries.len() == before {
        return Err(AppError::invalid("entry_id", "经历条目不存在。"));
    }
    write_entries(root, agent_id, &entries)?;
    Ok(entries)
}

/// 超出上限时按评分升序淘汰；评分相同则优先淘汰更早的记录。
pub fn prune(root: &Path, agent_id: &str, max_entries: usize) -> AppResult<Vec<ExperienceEntry>> {
    if max_entries > MAX_ENTRIES {
        return Err(AppError::invalid("max_entries", "保留数量必须在 0～1000 之间。"));
    }
    let mut entries = list(root, agent_id)?;
    if entries.len() <= max_entries {
        return Ok(entries);
    }
    entries.sort_by(|a, b| a.score.cmp(&b.score).then_with(|| a.recorded_at.cmp(&b.recorded_at)));
    let removals = entries.len() - max_entries;
    entries.drain(0..removals);
    write_entries(root, agent_id, &entries)?;
    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn entry_limits_and_path_components_are_checked() {
        let root = TempDir::new().unwrap();
        for id in ["../outside", "a/b", "a\\b", "C:outside", ".", "CON", "LPT1"] {
            assert!(list(root.path(), id).is_err(), "{id}");
        }
        for (content, score) in [("", 50), ("两行\n内容", 50), ("正文", 101)] {
            assert!(add(root.path(), "agent", content, score).is_err());
        }
        assert!(add(root.path(), "agent", &"\u{1f642}".repeat(9000), 50).is_err());
        let first = add(root.path(), "agent", "仅供本地测试的记录", 87).unwrap();
        assert_eq!(first.score, 87);
        assert_eq!(list(root.path(), "agent").unwrap()[0].id, first.id);
        assert_eq!(add(root.path(), "agent", &first.content, 87).unwrap().id, first.id);
        assert_eq!(list(root.path(), "agent").unwrap().len(), 1);
    }

    #[test]
    fn corrupt_and_oversized_files_are_preserved() {
        let root = TempDir::new().unwrap();
        add(root.path(), "agent", "初始正文", 50).unwrap();
        let path = experience_path(root.path(), "agent").unwrap();
        for body in [b"not an entry\n".to_vec(), vec![b'a'; MAX_FILE_BYTES + 1], vec![0xff]] {
            fs::write(&path, &body).unwrap();
            assert!(list(root.path(), "agent").is_err());
            assert!(add(root.path(), "agent", "不能覆盖损坏文件", 50).is_err());
            assert_eq!(fs::read(&path).unwrap(), body);
        }
    }

    #[test]
    fn publish_failure_and_cancellation_leave_original_bytes() {
        let root = TempDir::new().unwrap();
        let first = add(root.path(), "agent", "原记录", 50).unwrap();
        let path = experience_path(root.path(), "agent").unwrap();
        let before = fs::read(&path).unwrap();
        let error = write_entries_with(root.path(), "agent", &[first], |_, _| {
            Err(std::io::Error::other("injected publish failure").into())
        }).unwrap_err();
        assert_eq!(error.code, ErrorCode::IoError);
        assert_eq!(fs::read(&path).unwrap(), before);
        assert!(add_checked(root.path(), "agent", "已取消记录", 80, || {
            Err(AppError::new(ErrorCode::ShuttingDown, "已取消。"))
        }).is_err());
        assert_eq!(fs::read(&path).unwrap(), before);
        assert_eq!(fs::read_dir(path.parent().unwrap()).unwrap().count(), 1);
    }

    #[test]
    fn high_scores_and_newer_equal_scores_are_kept() {
        let root = TempDir::new().unwrap();
        let entries: Vec<_> = (0..40).map(|index| {
            let entry = ExperienceEntry {
                id: String::new(), recorded_at: format!("2026/11/{:02} 12:00", index % 28 + 1),
                score: if index == 3 { 99 } else { 30 }, content: format!("记录 {index}"),
            };
            ExperienceEntry { id: entry_id(&entry), ..entry }
        }).collect();
        write_entries(root.path(), "agent", &entries).unwrap();
        let selected = context_entries(list(root.path(), "agent").unwrap());
        assert_eq!(selected.len(), CONTEXT_ENTRIES);
        assert_eq!(selected[0].content, "记录 3");
        assert!(selected.windows(2).skip(1).all(|pair| pair[0].recorded_at >= pair[1].recorded_at));
        let remaining = prune(root.path(), "agent", 1).unwrap();
        assert_eq!(remaining[0].content, "记录 3");
        assert!(prune(root.path(), "agent", MAX_ENTRIES + 1).is_err());
    }
}
