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

use super::{
    database::Database,
    runtime::{RuntimeExperience, RuntimeInput, RuntimeMessage},
    search::SearchService,
};
use crate::domain::{contracts::*, error::AppResult};

pub type EventSink = Arc<dyn Fn(&DomainEvent) + Send + Sync>;
type Operation = Box<dyn FnOnce(&mut Database) + Send>;

enum Work {
    Run(Operation),
    Stop(mpsc::Sender<()>),
}

#[derive(Default)]
struct ShutdownProgress {
    reply: Option<mpsc::Receiver<()>>,
    database_stopped: bool,
    complete: bool,
}

pub struct DbWorker {
    sender: mpsc::SyncSender<Work>,
    closed: Arc<AtomicBool>,
    admission: Mutex<()>,
    shutdown_progress: Mutex<ShutdownProgress>,
    root: std::path::PathBuf,
    generation: String,
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
        let search = SearchService::new(
            root.join("chat.sqlite3"),
            generation.clone(),
            closed.clone(),
        )?;
        Ok(Arc::new(Self {
            sender,
            closed,
            admission: Mutex::new(()),
            shutdown_progress: Mutex::new(ShutdownProgress::default()),
            root: root.to_owned(),
            generation,
            event_sink,
            search,
            thread: Mutex::new(Some(thread)),
        }))
    }

    pub async fn call<T: Send + 'static>(
        &self,
        operation: impl FnOnce(&mut Database) -> AppResult<T> + Send + 'static,
    ) -> AppResult<T> {
        let (reply, mut receiver) = tauri::async_runtime::channel(1);
        {
            let _admission = self.admission.lock().expect("准入锁被污染");
            if self.closed.load(Ordering::Acquire) {
                return Err(shutting_down());
            }
            self.sender
                .try_send(Work::Run(Box::new(move |database| {
                    // 入队即接受；关闭准入不能撤销已接受的事务。
                    let _ = reply.blocking_send(operation(database));
                })))
                .map_err(|error| match error {
                    mpsc::TrySendError::Full(_) => AppError::new(
                        ErrorCode::Backpressure,
                        "本地数据队列已满，草稿未清除，请稍后重试。",
                    ),
                    mpsc::TrySendError::Disconnected(_) => shutting_down(),
                })?;
        }
        receiver
            .recv()
            .await
            .unwrap_or_else(|| Err(shutting_down()))
    }

    pub async fn list_experience(&self, request: ExperienceAgentRequest) -> AppResult<Vec<ExperienceEntry>> {
        self.call(move |database| database.list_experience(request)).await
    }

    pub async fn add_experience(&self, request: ExperienceAddRequest) -> AppResult<ExperienceEntry> {
        self.call(move |database| database.add_experience(request)).await
    }

    pub async fn update_experience(&self, request: ExperienceUpdateRequest) -> AppResult<ExperienceEntry> {
        self.call(move |database| database.update_experience(request)).await
    }

    pub async fn delete_experience(&self, request: ExperienceDeleteRequest) -> AppResult<Vec<ExperienceEntry>> {
        self.call(move |database| database.delete_experience(request)).await
    }

    pub async fn prune_experience(&self, request: ExperiencePruneRequest) -> AppResult<Vec<ExperienceEntry>> {
        self.call(move |database| database.prune_experience(request)).await
    }

    pub async fn record_experience(&self, experience: RuntimeExperience) -> AppResult<()> {
        self.call(move |database| database.record_experience(experience)).await
    }

    /// 智能体撤回自己三分钟内发出的消息。
    pub async fn recall_agent_message(
        &self,
        agent_id: String,
        message_id: String,
        generation: String,
    ) -> AppResult<()> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            if let Some(event) = database.recall_agent_message(&agent_id, &message_id, &generation)? {
                sink(&event);
            }
            Ok(())
        })
        .await
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

    pub async fn recall_message(&self, request: ChatRecallRequest) -> AppResult<ChatRecallResult> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            let (result, event) = database.recall_message(request)?;
            if let Some(event) = event {
                sink(&event);
            }
            Ok(result)
        })
        .await
    }

    pub async fn resolve_quotes(
        &self,
        request: ChatResolveQuotesRequest,
    ) -> AppResult<Vec<ChatMessage>> {
        self.call(move |database| database.resolve_quotes(request))
            .await
    }

    pub async fn list_messages(&self, request: ChatListRequest) -> AppResult<MessagePage> {
        self.call(move |database| database.list_messages(request))
            .await
    }

    pub async fn save_room(&self, request: RoomSaveRequest) -> AppResult<Room> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            let (room, event) = database.save_room(request)?;
            if let Some(event) = event {
                sink(&event);
            }
            Ok(room)
        })
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

    pub async fn get_news_configuration(
        &self,
        request: NewsConfigurationGetRequest,
    ) -> AppResult<NewsConfigurationState> {
        self.call(move |database| database.get_news_configuration(&request.data_generation_id))
            .await
    }

    pub async fn save_news_configuration(
        &self,
        request: NewsConfigurationSaveRequest,
    ) -> AppResult<NewsConfigurationState> {
        self.call(move |database| database.save_news_configuration(request))
            .await
    }

    pub async fn get_inbox(&self, request: InboxGetRequest) -> AppResult<InboxSummary> {
        self.call(move |database| database.get_inbox(&request.data_generation_id))
            .await
    }

    pub async fn mark_inbox_read(&self, request: InboxMarkReadRequest) -> AppResult<InboxSummary> {
        self.call(move |database| database.mark_inbox_read(request))
            .await
    }

    pub async fn set_inbox_muted(&self, request: InboxMuteRequest) -> AppResult<InboxSummary> {
        self.call(move |database| database.set_inbox_muted(request))
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

    pub async fn get_window_state(&self, generation: String) -> AppResult<Option<super::configuration::WindowState>> {
        self.call(move |database| database.get_window_state(&generation)).await
    }

    pub async fn save_window_state(&self, generation: String, state: super::configuration::WindowState) -> AppResult<()> {
        self.call(move |database| database.save_window_state(&generation, &state)).await
    }

    pub async fn delete_agent(&self, request: AgentDeleteRequest) -> AppResult<()> {
        self.call(move |database| database.delete_agent(request)).await
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

    pub async fn runtime_input(&self, id: String) -> AppResult<RuntimeInput> {
        self.call(move |database| database.runtime_input(&id)).await
    }

    pub async fn runtime_states(&self) -> AppResult<Vec<AgentRuntimeState>> {
        self.call(|database| database.runtime_states()).await
    }

    pub async fn runtime_mention_seq(
        &self,
        id: String,
        after_seq: DecimalString,
    ) -> AppResult<DecimalString> {
        self.call(move |database| database.runtime_mention_seq(&id, after_seq))
            .await
    }

    pub async fn runtime_is_paused(&self, id: String) -> AppResult<bool> {
        self.call(move |database| database.runtime_is_paused(&id))
            .await
    }

    pub async fn set_runtime_state(&self, state: AgentRuntimeState) -> AppResult<()> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            if let Some(event) = database.set_runtime_state(state)? {
                sink(&event);
            }
            Ok(())
        })
        .await
    }

    pub async fn set_runtime_paused(
        &self,
        id: String,
        paused: bool,
    ) -> AppResult<AgentRuntimeState> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            let (state, event) = database.set_runtime_paused(&id, paused)?;
            if let Some(event) = event {
                sink(&event);
            }
            Ok(state)
        })
        .await
    }

    pub async fn reserve_runtime_request(&self, owner: String, daily_limit: u32) -> AppResult<u32> {
        self.call(move |database| database.reserve_runtime_request(&owner, daily_limit))
            .await
    }

    pub async fn save_runtime_plan(
        &self,
        id: String,
        revision: DecimalString,
        next: Option<i64>,
        chain_id: String,
    ) -> AppResult<()> {
        self.call(move |database| database.save_runtime_plan(&id, revision, next, chain_id))
            .await
    }

    pub async fn runtime_plan(
        &self,
        id: String,
    ) -> AppResult<Option<(i64, String, DecimalString)>> {
        self.call(move |database| database.runtime_plan(&id)).await
    }

    pub async fn reserve_runtime_wake(&self, id: String) -> AppResult<Option<i64>> {
        self.call(move |database| database.reserve_runtime_wake(&id))
            .await
    }

    pub async fn runtime_chain(&self, message_seq: DecimalString) -> AppResult<String> {
        self.call(move |database| database.runtime_chain(message_seq))
            .await
    }

    pub async fn commit_runtime_message(
        &self,
        message: RuntimeMessage,
    ) -> AppResult<ChatSendResult> {
        let sink = self.event_sink.clone();
        self.call(move |database| {
            let (result, event) = database.commit_runtime_message(message)?;
            if let Some(event) = event {
                sink(&event);
            }
            Ok(result)
        })
        .await
    }

    fn stop(&self, deadline: Instant) -> AppResult<()> {
        let mut progress = loop {
            match self.shutdown_progress.try_lock() {
                Ok(progress) => break progress,
                Err(std::sync::TryLockError::Poisoned(_)) => {
                    return Err(AppError::new(
                        ErrorCode::InternalError,
                        "关闭状态异常，退出未完成。",
                    ));
                }
                Err(std::sync::TryLockError::WouldBlock) => {
                    if Instant::now() >= deadline {
                        return Err(AppError::new(
                            ErrorCode::ShuttingDown,
                            "关闭仍在执行，退出未完成。",
                        ));
                    }
                    thread::sleep(Duration::from_millis(5));
                }
            }
        };
        if progress.complete {
            return Ok(());
        }
        {
            let _admission = self.admission.lock().expect("准入锁被污染");
            self.closed.store(true, Ordering::Release);
        }
        self.search.cancel_all();
        if progress.reply.is_none() && !progress.database_stopped {
            let (reply, receiver) = mpsc::channel();
            let mut work = Work::Stop(reply);
            loop {
                // closed 与所有 Run 入队同用准入锁，Stop 永远排在已接受请求后。
                let admission = self.admission.lock().expect("准入锁被污染");
                let sent = self.sender.try_send(work);
                drop(admission);
                match sent {
                    Ok(()) => {
                        progress.reply = Some(receiver);
                        break;
                    }
                    Err(mpsc::TrySendError::Disconnected(_)) => {
                        return Err(AppError::new(
                            ErrorCode::InternalError,
                            "数据工作线程异常停止，退出未完成。",
                        ));
                    }
                    Err(mpsc::TrySendError::Full(returned)) => {
                        work = returned;
                        if Instant::now() >= deadline {
                            // Stop 尚未接受，可以安全重新开放原工作线程。
                            let _admission = self.admission.lock().expect("准入锁被污染");
                            self.closed.store(false, Ordering::Release);
                            return Err(shutting_down());
                        }
                        thread::sleep(Duration::from_millis(10));
                    }
                }
            }
        }
        if !progress.database_stopped {
            progress
                .reply
                .as_ref()
                .expect("Stop 已入队")
                .recv_timeout(deadline.saturating_duration_since(Instant::now()))
                .map_err(|_| {
                    AppError::new(
                        ErrorCode::ShuttingDown,
                        "数据排空超过退出截止，退出已取消。",
                    )
                })?;
            progress.database_stopped = true;
            progress.reply = None;
            if let Some(thread) = self.thread.lock().expect("工作线程锁被污染").take() {
                thread.join().map_err(|_| {
                    AppError::new(
                        ErrorCode::InternalError,
                        "数据工作线程异常停止，退出未完成。",
                    )
                })?;
            }
        }
        self.search.shutdown(deadline)?;
        progress.complete = true;
        Ok(())
    }

    pub async fn shutdown(self: Arc<Self>) -> AppResult<()> {
        // 截止从调用开始计算；并发关闭不会因为 closed=true 被假作成功。
        let deadline = Instant::now() + Duration::from_secs(5);
        tauri::async_runtime::spawn_blocking(move || self.stop(deadline))
            .await
            .map_err(|_| AppError::new(ErrorCode::InternalError, "关闭工作线程时发生错误。"))?
    }

    pub(crate) fn recover(self: Arc<Self>) -> AppResult<Arc<Self>> {
        if !self.closed.load(Ordering::Acquire) {
            return Ok(self);
        }
        // 仅后台恢复等待真实排空；退出命令本身始终有界且已经报告取消。
        {
            let mut progress = self.shutdown_progress.lock().expect("关闭锁被污染");
            if !progress.database_stopped {
                if let Some(reply) = progress.reply.as_ref() {
                    // 即使线程异常断开，也先等待 JoinHandle，确认旧写线程已结束。
                    let _ = reply.recv();
                }
                if let Some(thread) = self.thread.lock().expect("工作线程锁被污染").take() {
                    let _ = thread.join();
                }
                progress.reply = None;
                progress.database_stopped = true;
            }
            self.search
                .shutdown(Instant::now() + Duration::from_secs(5))?;
        }
        Self::open(&self.root, self.generation.clone(), self.event_sink.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::super::database::open_reader;
    use super::*;
    use std::{
        future::Future,
        task::{Context, Poll, Waker},
    };
    use tempfile::TempDir;

    fn poll_pending<T>(future: std::pin::Pin<&mut impl Future<Output = T>>) {
        assert!(matches!(
            future.poll(&mut Context::from_waker(Waker::noop())),
            Poll::Pending
        ));
    }

    fn wait_closed(worker: &DbWorker) {
        let deadline = Instant::now() + Duration::from_secs(2);
        while !worker.closed.load(Ordering::Acquire) {
            assert!(Instant::now() < deadline);
            thread::yield_now();
        }
    }

    #[test]
    fn accepted_write_drains_fifo_and_event_observes_commit_before_stop() {
        let directory = TempDir::new().unwrap();
        let events = Arc::new(Mutex::new(Vec::new()));
        let received = events.clone();
        let path = directory.path().join("chat.sqlite3");
        let worker = DbWorker::open(
            directory.path(),
            "fifo".into(),
            Arc::new(move |event| {
                let reader = open_reader(&path).unwrap();
                let committed: i64 = reader
                    .query_row("SELECT COUNT(*) FROM domain_events", [], |row| row.get(0))
                    .unwrap();
                assert_eq!(committed, 1);
                received.lock().unwrap().push(event.clone());
            }),
        )
        .unwrap();
        let (started, running) = mpsc::channel();
        let (release, blocked) = mpsc::channel();
        let mut blocker = Box::pin(worker.call(move |_| {
            started.send(()).unwrap();
            blocked.recv().unwrap();
            Ok(())
        }));
        poll_pending(blocker.as_mut());
        running.recv_timeout(Duration::from_secs(2)).unwrap();
        let mut write = Box::pin(worker.save_appearance(AppearanceSaveRequest {
            data_generation_id: "fifo".into(),
            client_request_id: "queued-write".into(),
            expected_revision: 1_i64.into(),
            theme: Theme::Dark,
            reduce_motion: true,
        }));
        poll_pending(write.as_mut());
        let stopping = worker.clone();
        let stop = thread::spawn(move || tauri::async_runtime::block_on(stopping.shutdown()));
        wait_closed(&worker);
        assert!(!stop.is_finished());
        assert_eq!(
            tauri::async_runtime::block_on(worker.call(|_| Ok(())))
                .unwrap_err()
                .code,
            ErrorCode::ShuttingDown
        );
        release.send(()).unwrap();
        tauri::async_runtime::block_on(blocker).unwrap();
        assert_eq!(
            tauri::async_runtime::block_on(write).unwrap().revision.0,
            "2"
        );
        stop.join().unwrap().unwrap();
        assert!(worker.shutdown_progress.lock().unwrap().complete);
        assert_eq!(events.lock().unwrap().len(), 1);
        let mut database = Database::open(directory.path(), "reopen-fifo".into()).unwrap();
        let snapshot = database
            .snapshot(AppSnapshotRequest {
                data_generation_id: None,
                last_event_seq: None,
            })
            .unwrap();
        assert_eq!(snapshot.appearance.theme, Theme::Dark);
    }

    #[test]
    fn timed_out_stop_is_not_success_and_recovery_reopens_only_after_accepted_work() {
        let directory = TempDir::new().unwrap();
        let worker = DbWorker::open(directory.path(), "recover".into(), Arc::new(|_| {})).unwrap();
        let (started, running) = mpsc::channel();
        let (release, blocked) = mpsc::channel();
        let mut blocker = Box::pin(worker.call(move |_| {
            started.send(()).unwrap();
            blocked.recv().unwrap();
            Ok(())
        }));
        poll_pending(blocker.as_mut());
        running.recv_timeout(Duration::from_secs(2)).unwrap();
        assert_eq!(
            worker
                .stop(Instant::now() + Duration::from_millis(20))
                .unwrap_err()
                .code,
            ErrorCode::ShuttingDown
        );
        assert_eq!(
            worker
                .stop(Instant::now() + Duration::from_millis(20))
                .unwrap_err()
                .code,
            ErrorCode::ShuttingDown
        );
        assert!(!worker.shutdown_progress.lock().unwrap().complete);
        let recovering = worker.clone();
        let recovery = thread::spawn(move || recovering.recover());
        assert!(!recovery.is_finished());
        release.send(()).unwrap();
        tauri::async_runtime::block_on(blocker).unwrap();
        let reopened = recovery.join().unwrap().unwrap();
        tauri::async_runtime::block_on(reopened.call(|_| Ok(()))).unwrap();
        tauri::async_runtime::block_on(reopened.shutdown()).unwrap();
    }

    #[test]
    fn full_queue_stop_deadline_restores_admission_without_losing_accepted_work() {
        let directory = TempDir::new().unwrap();
        let worker =
            DbWorker::open(directory.path(), "full-queue".into(), Arc::new(|_| {})).unwrap();
        let (started, running) = mpsc::channel();
        let (release, blocked) = mpsc::channel();
        let mut blocker = Box::pin(worker.call(move |_| {
            started.send(()).unwrap();
            blocked.recv().unwrap();
            Ok(())
        }));
        poll_pending(blocker.as_mut());
        running.recv_timeout(Duration::from_secs(2)).unwrap();
        let mut accepted = Vec::new();
        for index in 0..64 {
            let mut operation = Box::pin(worker.call(move |_| Ok(index)));
            poll_pending(operation.as_mut());
            accepted.push(operation);
        }
        assert!(
            worker
                .stop(Instant::now() + Duration::from_millis(20))
                .is_err()
        );
        assert!(!worker.closed.load(Ordering::Acquire));
        assert_eq!(
            tauri::async_runtime::block_on(worker.call(|_| Ok(())))
                .unwrap_err()
                .code,
            ErrorCode::Backpressure
        );
        release.send(()).unwrap();
        tauri::async_runtime::block_on(blocker).unwrap();
        for (index, operation) in accepted.into_iter().enumerate() {
            assert_eq!(tauri::async_runtime::block_on(operation).unwrap(), index);
        }
        tauri::async_runtime::block_on(worker.call(|_| Ok(()))).unwrap();
        tauri::async_runtime::block_on(worker.shutdown()).unwrap();
    }

    #[test]
    fn concurrent_shutdown_waits_for_real_completion_instead_of_closed_flag() {
        let directory = TempDir::new().unwrap();
        let worker =
            DbWorker::open(directory.path(), "concurrent-stop".into(), Arc::new(|_| {})).unwrap();
        let (started, running) = mpsc::channel();
        let (release, blocked) = mpsc::channel();
        let mut blocker = Box::pin(worker.call(move |_| {
            started.send(()).unwrap();
            blocked.recv().unwrap();
            Ok(())
        }));
        poll_pending(blocker.as_mut());
        running.recv_timeout(Duration::from_secs(2)).unwrap();
        let first_worker = worker.clone();
        let first =
            thread::spawn(move || first_worker.stop(Instant::now() + Duration::from_secs(2)));
        wait_closed(&worker);
        let (result, received) = mpsc::channel();
        let second_worker = worker.clone();
        let second = thread::spawn(move || {
            result
                .send(second_worker.stop(Instant::now() + Duration::from_secs(2)))
                .unwrap();
        });
        assert!(matches!(
            received.recv_timeout(Duration::from_millis(30)),
            Err(mpsc::RecvTimeoutError::Timeout)
        ));
        release.send(()).unwrap();
        tauri::async_runtime::block_on(blocker).unwrap();
        first.join().unwrap().unwrap();
        received
            .recv_timeout(Duration::from_secs(2))
            .unwrap()
            .unwrap();
        second.join().unwrap();
    }

    #[test]
    fn racing_admission_and_stop_never_cancel_an_accepted_operation() {
        for _ in 0..24 {
            let directory = TempDir::new().unwrap();
            let worker = DbWorker::open(directory.path(), "race".into(), Arc::new(|_| {})).unwrap();
            let barrier = Arc::new(std::sync::Barrier::new(2));
            let writer = worker.clone();
            let writer_barrier = barrier.clone();
            let write = thread::spawn(move || {
                writer_barrier.wait();
                tauri::async_runtime::block_on(writer.call(|database| {
                    database
                        .conn
                        .execute("UPDATE app_settings SET reduce_motion=1", [])?;
                    Ok(())
                }))
            });
            barrier.wait();
            tauri::async_runtime::block_on(worker.clone().shutdown()).unwrap();
            let result = write.join().unwrap();
            let reader = open_reader(&directory.path().join("chat.sqlite3")).unwrap();
            let committed: bool = reader
                .query_row("SELECT reduce_motion FROM app_settings", [], |row| {
                    row.get(0)
                })
                .unwrap();
            match result {
                Ok(()) => assert!(committed),
                Err(error) => {
                    assert_eq!(error.code, ErrorCode::ShuttingDown);
                    assert!(!committed);
                }
            }
            tauri::async_runtime::block_on(worker.shutdown()).unwrap();
        }
    }
}
