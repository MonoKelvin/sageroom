use std::{
    fs::{self, OpenOptions},
    path::Path,
    thread,
    time::{Duration, Instant},
};

use rusqlite::{
    Connection,
    backup::{Backup, StepResult},
};

use super::database::{configure_connection, verify_database};
use crate::domain::{
    contracts::{AppError, ErrorCode},
    error::AppResult,
};

pub fn backup_database(source: &Connection, target: &Path) -> AppResult<()> {
    let reserved = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(target)
        .map_err(|error| {
            if error.kind() == std::io::ErrorKind::AlreadyExists {
                AppError::new(ErrorCode::InvalidInput, "快照目标已存在，未覆盖原文件。")
            } else {
                error.into()
            }
        })?;
    drop(reserved);
    let result = (|| {
        let mut destination = Connection::open(target)?;
        configure_connection(&destination)?;
        {
            let backup = Backup::new(source, &mut destination)?;
            let deadline = Instant::now() + Duration::from_secs(10);
            loop {
                if Instant::now() >= deadline {
                    return Err(AppError::new(
                        ErrorCode::IoError,
                        "数据库快照超过时间预算，未发布成功快照。",
                    ));
                }
                match backup.step(128)? {
                    StepResult::Done => break,
                    StepResult::More => {}
                    StepResult::Busy | StepResult::Locked => {
                        thread::sleep(Duration::from_millis(10))
                    }
                    _ => {
                        return Err(AppError::new(
                            ErrorCode::IoError,
                            "数据库快照未完成，原数据未覆盖。",
                        ));
                    }
                }
            }
        }
        verify_database(&destination)?;
        drop(destination);
        OpenOptions::new()
            .read(true)
            .write(true)
            .open(target)?
            .sync_all()?;
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(target);
    }
    result
}
