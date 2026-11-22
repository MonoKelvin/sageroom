//! 每个智能体独立的经历文件存储。
//!
//! 目录结构：`<data>/agents/<agent_id>/experience.md`
//! 每行格式：`YYYY/MM/DD HH:mm  [score]  content`
//! 文件过大时按评分从低到高淘汰。

use std::{
    fs,
    path::{Path, PathBuf},
};

use crate::domain::{
    contracts::{AppError, ExperienceEntry, TEXT_CHARACTER_LIMIT},
    error::{AppResult, now_ms, validate_id},
};

/// 本地时区相对 UTC 的秒数。项目面向本地桌面场景，默认东八区。
/// 可通过 `SAGEROOM_TZ_OFFSET_SECONDS` 覆盖，便于其他地区使用。
fn timezone_offset_seconds() -> i64 {
    std::env::var("SAGEROOM_TZ_OFFSET_SECONDS")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(8 * 3600)
}

fn validate_entry(content: &str, score: u8) -> AppResult<()> {
    let trimmed = content.trim();
    if trimmed.is_empty()
        || trimmed.chars().count() > TEXT_CHARACTER_LIMIT
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

fn agent_dir(root: &Path, agent_id: &str) -> AppResult<PathBuf> {
    validate_id(agent_id, "agent_id")?;
    let root = root.canonicalize().unwrap_or_else(|_| root.to_path_buf());
    let directory = root.join("agents").join(agent_id);
    let canonical = directory.canonicalize().unwrap_or_else(|_| directory.clone());
    if !canonical.starts_with(&root) {
        return Err(AppError::invalid("agent_id", "智能体数据目录无效。"));
    }
    Ok(directory)
}

fn experience_path(root: &Path, agent_id: &str) -> AppResult<PathBuf> {
    Ok(agent_dir(root, agent_id)?.join("experience.md"))
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

/// 条目 ID 用内容指纹生成，写入时不落盘额外字段，读取时可稳定重建。
fn entry_id(entry: &ExperienceEntry) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    (&entry.recorded_at, entry.score, &entry.content).hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

fn serialize_entry(entry: &ExperienceEntry) -> String {
    format!("{}  [{}] {}", entry.recorded_at, entry.score, entry.content)
}

fn parse_line(line: &str) -> Option<ExperienceEntry> {
    // 形如：2026/11/21 23:12  [60] 加班到深夜才回来
    let (stamp, rest) = line.split_once("  [")?;
    let (score, content) = rest.split_once("] ")?;
    let score: u8 = score.parse().ok()?;
    let entry = ExperienceEntry {
        id: String::new(),
        recorded_at: stamp.trim().to_owned(),
        score,
        content: content.trim().to_owned(),
    };
    let id = entry_id(&entry);
    Some(ExperienceEntry { id, ..entry })
}

fn read_entries(root: &Path, agent_id: &str) -> AppResult<Vec<ExperienceEntry>> {
    let path = experience_path(root, agent_id)?;
    let text = match fs::read_to_string(&path) {
        Ok(text) => text,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(error) => return Err(AppError::from(error)),
    };
    Ok(text.lines().filter_map(parse_line).collect())
}

fn write_entries(root: &Path, agent_id: &str, entries: &[ExperienceEntry]) -> AppResult<()> {
    let directory = agent_dir(root, agent_id)?;
    fs::create_dir_all(&directory).map_err(AppError::from)?;
    let path = directory.join("experience.md");
    let mut body = entries.iter().map(serialize_entry).collect::<Vec<_>>().join("\n");
    if !body.is_empty() {
        body.push('\n');
    }
    fs::write(path, body).map_err(AppError::from)
}

pub fn list(root: &Path, agent_id: &str) -> AppResult<Vec<ExperienceEntry>> {
    read_entries(root, agent_id)
}

pub fn add(root: &Path, agent_id: &str, content: &str, score: u8) -> AppResult<ExperienceEntry> {
    validate_entry(content, score)?;
    let mut entries = read_entries(root, agent_id)?;
    let entry = ExperienceEntry {
        id: String::new(),
        recorded_at: format_timestamp(now_ms()),
        score,
        content: content.trim().to_owned(),
    };
    let entry = ExperienceEntry { id: entry_id(&entry), ..entry };
    entries.push(entry.clone());
    write_entries(root, agent_id, &entries)?;
    Ok(entry)
}

pub fn delete(root: &Path, agent_id: &str, entry_id: &str) -> AppResult<Vec<ExperienceEntry>> {
    let mut entries = read_entries(root, agent_id)?;
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
    let mut entries = read_entries(root, agent_id)?;
    if entries.len() <= max_entries {
        return Ok(entries);
    }
    entries.sort_by(|a, b| a.score.cmp(&b.score).then_with(|| a.recorded_at.cmp(&b.recorded_at)));
    let removals = entries.len() - max_entries;
    entries.drain(0..removals);
    write_entries(root, agent_id, &entries)?;
    Ok(entries)
}

/// 由运行时在解析到非空 `experience` 后自动调用。
pub fn record_from_decision(root: &Path, agent_id: &str, experience: &str) -> AppResult<Option<ExperienceEntry>> {
    let content = experience.trim();
    if content.is_empty() {
        return Ok(None);
    }
    // 内容里已包含日期时按其中的重要度线索评分；默认给中等分值。
    let score = if content.contains("换工作") || content.contains("搬家") || content.contains("入职") {
        90
    } else if content.contains("生日") || content.contains("旅行") {
        70
    } else {
        50
    };
    add(root, agent_id, content, score).map(Some)
}
