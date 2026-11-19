use std::{
    path::Path,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
        mpsc,
    },
    thread,
    time::{Duration, Instant},
};

use super::{database::Database, search::SearchService};
use crate::domain::{contracts::*, error::AppResult};

pub type EventSink = Arc<dyn Fn(&DomainEvent) + Send + Sync>;
type Operation = Box<dyn FnOnce(&mut Database) + Send>;

enum Work {
    Run(Operation),
    Stop(mpsc::Sender<()>),
}

pub struct DbWorker {
    sender: mpsc::SyncSender<Work>,
    closed: Arc<AtomicBool>,
    event_sink: EventSink,
    pub search: SearchService,
    thread: Mutex<Option<thread::JoinHandle<()>>>,
}

fn shutting_down() -> AppError {
    AppError::new(ErrorCode::ShuttingDown, "应用正在退出，未提交新的操作。")
}

impl DbWorker {
    pub fn open(root: &Path, generation: String, event_sink: EventSink) -> AppResult<Arc<Self>> {
        let (sender, receiver) = mpsc::sync_channel(64);
        let (initialized, initialization) = mpsc::channel();
        let worker_root = root.to_owned();
        let worker_generation = generation.clone();
        let thread = thread::Builder::new()
            .name("sageroom-database".into())
            .spawn(move || {
                let mut database = match Database::open(&worker_root, worker_generation) {
                    Ok(database) => database,
                    Err(error) => {
                        let _ = initialized.send(Err(error));
                        return;
                    }
                };
                if initialized.send(Ok(())).is_err() {
                    return;
                }
                while let Ok(work) = receiver.recv() {
                    match work {
                        Work::Run(operation) => operation(&mut database),
                        Work::Stop(reply) => {
                            drop(database);
                            let _ = reply.send(());
                            return;
                        }
                    }
                }
            })?;
        if let Err(error) = initialization.recv().map_err(|_| {
            AppError::new(
                ErrorCode::IoError,
                "本地数据工作线程未完成初始化，原文件已保留。",
            )
        })? {
            let _ = thread.join();
            return Err(error);
        }
        let closed = Arc::new(AtomicBool::new(false));
        let search = SearchService::new(root.join("chat.sqlite3"), generation, closed.clone())?;
        Ok(Arc::new(Self {
            sender,
            closed,
            event_sink,
            search,
            thread: Mutex::new(Some(thread)),
        }))
    }

    pub async fn call<T: Send + 'static>(
        &self,
        operation: impl FnOnce(&mut Database) -> AppResult<T> + Send + 'static,
    ) -> AppResult<T> {
        if self.closed.load(Ordering::Acquire) {
            return Err(shutting_down());
        }
        let closed = self.closed.clone();
        let (reply, mut receiver) = tauri::async_runtime::channel(1);
        self.sender
            .try_send(Work::Run(Box::new(move |database| {
                let result = if closed.load(Ordering::Acquire) {
                    Err(shutting_down())
                } else {
                    operation(database)
                };
                let _ = reply.blocking_send(result);
            })))
            .map_err(|error| match error {
                mpsc::TrySendError::Full(_) => AppError::new(
                    ErrorCode::Backpressure,
                    "本地数据队列已满，草稿未清除，请稍后重试。",
                ),
                mpsc::TrySendError::Disconnected(_) => shutting_down(),
            })?;
        receiver
            .recv()
            .await
            .unwrap_or_else(|| Err(shutting_down()))
    }

    pub async fn snapshot(&self, request: AppSnapshotRequest) -> AppResult<AppSnapshot> {
        self.call(move |database| database.snapshot(request)).await
    }

    pub async fn send_message(&self, request: ChatSendRequest) -> AppResult<ChatSendResult> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            let (result, event) = database.send_message(request)?;
            if let Some(event) = event {
                sink(&event);
            }
            Ok(result)
        })
        .await
    }

    pub async fn list_messages(&self, request: ChatListRequest) -> AppResult<MessagePage> {
        self.call(move |database| database.list_messages(request))
            .await
    }

    pub async fn save_appearance(&self, request: AppearanceSaveRequest) -> AppResult<Appearance> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            let (appearance, event) = database.save_appearance(request)?;
            if let Some(event) = event {
                sink(&event);
            }
            Ok(appearance)
        })
        .await
    }

    pub async fn get_global_configuration(
        &self,
        request: GlobalConfigurationGetRequest,
    ) -> AppResult<GlobalConfiguration> {
        self.call(move |database| database.get_global_configuration(&request.data_generation_id))
            .await
    }

    pub async fn save_global_configuration(
        &self,
        request: GlobalConfigurationSaveRequest,
    ) -> AppResult<GlobalConfiguration> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            let (result, event) = database.save_global_configuration(request)?;
            if let Some(event) = event {
                sink(&event);
            }
            Ok(result)
        })
        .await
    }

    pub async fn list_agents(
        &self,
        request: AgentListRequest,
    ) -> AppResult<Vec<AgentConfiguration>> {
        self.call(move |database| database.list_agents(&request.data_generation_id))
            .await
    }

    pub async fn save_agent(&self, request: AgentSaveRequest) -> AppResult<AgentConfiguration> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            let (result, event) = database.save_agent(request)?;
            if let Some(event) = event {
                sink(&event);
            }
            Ok(result)
        })
        .await
    }

    pub async fn get_user_profile(&self, request: UserProfileGetRequest) -> AppResult<UserProfile> {
        self.call(move |database| database.get_user_profile(&request.data_generation_id))
            .await
    }

    pub async fn save_user_profile(
        &self,
        request: UserProfileSaveRequest,
    ) -> AppResult<UserProfile> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            let (result, event) = database.save_user_profile(request)?;
            if let Some(event) = event {
                sink(&event);
            }
            Ok(result)
        })
        .await
    }

    pub async fn set_credential_reference(
        &self,
        generation: String,
        id: String,
        revision: DecimalString,
        reference: Option<String>,
    ) -> AppResult<()> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            database.check_generation(&generation)?;
            let event = database.replace_credential_reference(&id, &revision, reference)?;
            sink(&event);
            Ok(())
        })
        .await
    }

    pub async fn shutdown(self: Arc<Self>) -> AppResult<()> {
        if self.closed.swap(true, Ordering::AcqRel) {
            return Ok(());
        }
        self.search.cancel_all();
        tauri::async_runtime::spawn_blocking(move || {
            let deadline = Instant::now() + Duration::from_secs(5);
            let (reply, receiver) = mpsc::channel();
            let mut work = Work::Stop(reply);
            loop {
                match self.sender.try_send(work) {
                    Ok(()) => break,
                    Err(mpsc::TrySendError::Disconnected(_)) => return Ok(()),
                    Err(mpsc::TrySendError::Full(returned)) => {
                        work = returned;
                        if Instant::now() >= deadline {
                            return Err(shutting_down());
                        }
                        thread::sleep(Duration::from_millis(10));
                    }
                }
            }
            receiver
                .recv_timeout(deadline.saturating_duration_since(Instant::now()))
                .map_err(|_| shutting_down())?;
            if let Some(thread) = self.thread.lock().expect("工作线程锁被污染").take() {
                let _ = thread.join();
            }
            self.search.shutdown(deadline)
        })
        .await
        .map_err(|_| {
            AppError::new(
                ErrorCode::InternalError,
                "关闭工作线程时发生错误，未启动新的操作。",
            )
        })?
    }
}
