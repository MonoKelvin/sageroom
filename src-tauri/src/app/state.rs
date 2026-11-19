use std::{
    path::PathBuf,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
};

use tauri::{AppHandle, Emitter};
use uuid::Uuid;

use crate::{
    domain::{
        contracts::{AppError, ErrorCode},
        error::AppResult,
    },
    storage::worker::DbWorker,
};

pub struct AppState {
    pub generation: String,
    storage: AppResult<Arc<DbWorker>>,
    shutting_down: AtomicBool,
}

impl AppState {
    pub fn open(directory: tauri::Result<PathBuf>, app: AppHandle) -> Self {
        let generation = Uuid::now_v7().to_string();
        let storage = directory
            .map_err(|_| {
                AppError::new(
                    ErrorCode::IoError,
                    "无法获取应用数据目录，请检查本地用户环境。",
                )
            })
            .and_then(|directory| {
                DbWorker::open(
                    &directory.join("data"),
                    generation.clone(),
                    Arc::new(move |event| {
                        let _ = app.emit("sageroom://domain", event);
                    }),
                )
            });
        Self {
            generation,
            storage,
            shutting_down: AtomicBool::new(false),
        }
    }

    pub fn worker(&self) -> AppResult<Arc<DbWorker>> {
        if self.is_shutting_down() {
            return Err(AppError::new(
                ErrorCode::ShuttingDown,
                "应用正在退出，未启动新的操作。",
            ));
        }
        self.storage.clone()
    }

    pub fn is_shutting_down(&self) -> bool {
        self.shutting_down.load(Ordering::Acquire)
    }

    pub fn begin_shutdown(&self) -> Option<AppResult<Arc<DbWorker>>> {
        if self.shutting_down.swap(true, Ordering::AcqRel) {
            None
        } else {
            Some(self.storage.clone())
        }
    }
}
