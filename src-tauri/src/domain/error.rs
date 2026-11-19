use std::{
    fmt,
    time::{SystemTime, UNIX_EPOCH},
};

use rusqlite::ErrorCode as SqliteCode;
use uuid::Uuid;

use super::contracts::{AppError, ErrorCode, Retryability};

pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        let retryability = match code {
            ErrorCode::DbBusy | ErrorCode::Backpressure => Retryability::Retry,
            ErrorCode::InvalidInput
            | ErrorCode::PermissionDenied
            | ErrorCode::IdempotencyConflict
            | ErrorCode::CapabilityUnsupported
            | ErrorCode::MessageNotFound => Retryability::Never,
            _ => Retryability::AfterUserAction,
        };
        Self {
            code,
            message: message.into(),
            retryability,
            field_path: None,
            trace_id: Uuid::now_v7().to_string(),
            may_have_been_charged: false,
        }
    }

    pub fn invalid(field: &str, message: &str) -> Self {
        let mut error = Self::new(ErrorCode::InvalidInput, message);
        error.field_path = Some(field.to_owned());
        error
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}（追踪 {}）", self.message, self.trace_id)
    }
}

impl std::error::Error for AppError {}

impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        match error {
            rusqlite::Error::SqliteFailure(cause, _) => match cause.code {
                SqliteCode::DatabaseBusy | SqliteCode::DatabaseLocked => {
                    Self::new(ErrorCode::DbBusy, "聊天数据库暂时忙碌，请稍后重试。")
                }
                SqliteCode::DiskFull => Self::new(
                    ErrorCode::DiskFull,
                    "磁盘空间不足，消息尚未保存，请释放空间后重试。",
                ),
                SqliteCode::DatabaseCorrupt | SqliteCode::NotADatabase => Self::new(
                    ErrorCode::DbCorrupt,
                    "聊天数据库损坏，原文件已保留，请使用有效备份恢复。",
                ),
                SqliteCode::CannotOpen | SqliteCode::ReadOnly | SqliteCode::SystemIoFailure => {
                    Self::new(
                        ErrorCode::IoError,
                        "无法读写聊天数据，请检查目录权限和磁盘状态。",
                    )
                }
                SqliteCode::ConstraintViolation => Self::new(
                    ErrorCode::InvalidInput,
                    "关联记录不存在或数据已变更，请刷新后重试。",
                ),
                _ => Self::new(
                    ErrorCode::InternalError,
                    "数据操作未完成，请保留追踪 ID 后检查诊断。",
                ),
            },
            rusqlite::Error::QueryReturnedNoRows => {
                Self::new(ErrorCode::MessageNotFound, "目标记录不存在，请刷新后重试。")
            }
            _ => Self::new(
                ErrorCode::InternalError,
                "数据操作未完成，请保留追踪 ID 后检查诊断。",
            ),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(_: std::io::Error) -> Self {
        Self::new(
            ErrorCode::IoError,
            "无法读写本地数据，请检查目录权限和磁盘状态。",
        )
    }
}

impl From<serde_json::Error> for AppError {
    fn from(_: serde_json::Error) -> Self {
        Self::new(
            ErrorCode::InternalError,
            "本地数据格式不符合当前合同，请检查诊断。",
        )
    }
}

pub fn now_ms() -> i64 {
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_millis() as i64,
        Err(error) => -(error.duration().as_millis() as i64),
    }
}

pub fn parse_counter(value: &super::contracts::DecimalString, field: &str) -> AppResult<i64> {
    let text = &value.0;
    if text.is_empty()
        || text.len() > 19
        || (text.len() > 1 && text.starts_with('0'))
        || !text.bytes().all(|b| b.is_ascii_digit())
    {
        return Err(AppError::invalid(
            field,
            "序号必须为规范的非负十进制整数字符串。",
        ));
    }
    text.parse()
        .map_err(|_| AppError::invalid(field, "序号超过本地数据库支持的范围。"))
}

pub fn validate_id(value: &str, field: &str) -> AppResult<()> {
    if value.is_empty() || value.len() > 128 || value.chars().any(char::is_control) {
        return Err(AppError::invalid(
            field,
            "标识不能为空、过长或包含控制字符。",
        ));
    }
    Ok(())
}
