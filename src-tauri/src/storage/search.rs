use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
        mpsc,
    },
    thread,
    time::{Duration, Instant},
};

use rusqlite::{Connection, InterruptHandle, params};
use serde::{Deserialize, Serialize};

use super::database::open_reader;
use crate::domain::{
    contracts::*,
    error::{AppResult, validate_id},
};

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct SearchCursor {
    data_generation_id: String,
    query: String,
    sender_id: Option<String>,
    created_after: Option<i64>,
    created_before: Option<i64>,
    before_seq: i64,
}

pub fn validate_search(request: &ChatSearchRequest) -> AppResult<()> {
    validate_id(&request.search_id, "search_id")?;
    if request.query.len() > 1024
        || request.query.chars().count() > 256
        || request.query.trim().is_empty()
    {
        return Err(AppError::invalid(
            "query",
            "请输入 1～256 个 Unicode 字符，查询不能只有空白。",
        ));
    }
    if let Some(id) = &request.sender_id {
        validate_id(id, "sender_id")?;
    }
    for (field, value) in [
        ("created_after", request.created_after),
        ("created_before", request.created_before),
    ] {
        if value
            .is_some_and(|value| !(-9_007_199_254_740_991..=9_007_199_254_740_991).contains(&value))
        {
            return Err(AppError::invalid(field, "日期必须是有效的 UTC 毫秒时间。"));
        }
    }
    if let (Some(after), Some(before)) = (request.created_after, request.created_before)
        && after >= before
    {
        return Err(AppError::invalid(
            "created_before",
            "结束日期必须晚于开始日期。",
        ));
    }
    if request.limit == 0 || request.limit > PAGE_LIMIT {
        return Err(AppError::invalid("limit", "检索数量必须在 1～200 之间。"));
    }
    if request
        .cursor
        .as_ref()
        .is_some_and(|cursor| cursor.len() > 4096)
    {
        return Err(AppError::invalid("cursor", "检索游标无效，请重新检索。"));
    }
    Ok(())
}

pub fn search_database(conn: &Connection, request: &ChatSearchRequest) -> AppResult<SearchPage> {
    validate_search(request)?;
    if let Some(id) = &request.sender_id {
        let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM participants WHERE id=?1)",
            [id],
            |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::invalid(
                "sender_id",
                "筛选成员不存在，请重新选择。",
            ));
        }
    }
    let before = if let Some(cursor) = &request.cursor {
        let cursor: SearchCursor = serde_json::from_str(cursor)
            .map_err(|_| AppError::invalid("cursor", "检索游标无效，请重新检索。"))?;
        if cursor.data_generation_id != request.data_generation_id
            || cursor.query != request.query
            || cursor.sender_id != request.sender_id
            || cursor.created_after != request.created_after
            || cursor.created_before != request.created_before
            || cursor.before_seq < 0
        {
            return Err(AppError::invalid(
                "cursor",
                "检索游标不属于当前数据和查询，请重新检索。",
            ));
        }
        cursor.before_seq
    } else {
        i64::MAX
    };

    // 非普通 ASCII/CJK 模式保守扫描，避免索引规范化造成漏匹配。
    let indexed = request.query.chars().count() >= 3
        && request.query.chars().all(|character| {
            character.is_ascii_alphanumeric()
                || character == ' '
                || ('\u{4e00}'..='\u{9fff}').contains(&character)
        });
    let candidate = if indexed {
        " AND s.seq IN (SELECT rowid FROM message_search WHERE message_search MATCH ?8)"
    } else {
        " AND ?8 IS NULL"
    };
    let sql = format!(
        "SELECT m.id, m.seq, m.sender_id, substr(s.text, max(1, instr(s.text, ?1) - 30), ?4), m.created_at FROM search_text s JOIN messages m ON m.seq = s.seq WHERE m.state = 'visible' AND m.seq < ?2 AND instr(s.text, ?1) > 0 AND (?5 IS NULL OR m.sender_id=?5) AND (?6 IS NULL OR m.created_at>=?6) AND (?7 IS NULL OR m.created_at<?7){candidate} ORDER BY m.seq DESC LIMIT ?3"
    );
    let mut statement = conn.prepare(&sql)?;
    let collect = |row: &rusqlite::Row<'_>| -> rusqlite::Result<SearchHit> {
        Ok(SearchHit {
            message_id: row.get(0)?,
            seq: row.get::<_, i64>(1)?.into(),
            sender_id: row.get(2)?,
            snippet: row.get(3)?,
            created_at: row.get(4)?,
        })
    };
    let snippet_length = request.query.chars().count() as i64 + 60;
    let literal = indexed.then(|| format!("\"{}\"", request.query.replace('"', "\"\"")));
    let mut items = statement
        .query_map(
            params![
                request.query,
                before,
                request.limit + 1,
                snippet_length,
                request.sender_id,
                request.created_after,
                request.created_before,
                literal
            ],
            collect,
        )?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    let has_more = items.len() > request.limit as usize;
    items.truncate(request.limit as usize);
    let next_cursor = if has_more {
        items
            .last()
            .map(|hit| {
                serde_json::to_string(&SearchCursor {
                    data_generation_id: request.data_generation_id.clone(),
                    query: request.query.clone(),
                    sender_id: request.sender_id.clone(),
                    created_after: request.created_after,
                    created_before: request.created_before,
                    before_seq: hit.seq.0.parse().expect("数据库序号已验证"),
                })
            })
            .transpose()?
    } else {
        None
    };
    Ok(SearchPage {
        data_generation_id: request.data_generation_id.clone(),
        search_id: request.search_id.clone(),
        query: request.query.clone(),
        semantics: SearchSemantics::LiteralUnicodeSubstring,
        items,
        has_more,
        next_cursor,
    })
}

struct SearchControl {
    cancelled: AtomicBool,
    deadline: Instant,
    interrupt: Mutex<Option<Arc<InterruptHandle>>>,
}

type SearchKey = (String, String);
type Registry = Arc<Mutex<HashMap<SearchKey, Arc<SearchControl>>>>;

struct SearchJob {
    request: ChatSearchRequest,
    key: SearchKey,
    control: Arc<SearchControl>,
    reply: tauri::async_runtime::Sender<AppResult<SearchPage>>,
}

enum Work {
    Search(SearchJob),
    Stop(mpsc::Sender<()>),
}

pub struct SearchService {
    sender: mpsc::SyncSender<Work>,
    registry: Registry,
    closed: Arc<AtomicBool>,
    generation: String,
    thread: Mutex<Option<thread::JoinHandle<()>>>,
}

fn execute_search(path: &Path, job: &SearchJob) -> AppResult<SearchPage> {
    if job.control.cancelled.load(Ordering::Acquire) {
        return Err(cancelled());
    }
    if Instant::now() >= job.control.deadline {
        return Err(timed_out());
    }
    let mut conn = open_reader(path)?;
    let interrupt = Arc::new(conn.get_interrupt_handle());
    *job.control.interrupt.lock().expect("检索锁被污染") = Some(interrupt);
    let control = job.control.clone();
    conn.progress_handler(
        500,
        Some(move || {
            control.cancelled.load(Ordering::Acquire) || Instant::now() >= control.deadline
        }),
    )?;
    let result = search_database(&conn, &job.request);
    *job.control.interrupt.lock().expect("检索锁被污染") = None;
    if job.control.cancelled.load(Ordering::Acquire) {
        Err(cancelled())
    } else if Instant::now() >= job.control.deadline {
        Err(timed_out())
    } else {
        result
    }
}

fn cancelled() -> AppError {
    AppError::new(
        ErrorCode::SearchCancelled,
        "检索已取消，未将未完成范围当作无结果。",
    )
}

fn timed_out() -> AppError {
    AppError::new(
        ErrorCode::SearchTimeout,
        "检索超过时间预算，结果范围未完成；请缩短或调整查询后重试。",
    )
}

impl SearchService {
    pub fn new(path: PathBuf, generation: String, closed: Arc<AtomicBool>) -> AppResult<Self> {
        let (sender, receiver) = mpsc::sync_channel(4);
        let registry: Registry = Arc::new(Mutex::new(HashMap::new()));
        let worker_registry = registry.clone();
        let thread = thread::Builder::new()
            .name("sageroom-search".into())
            .spawn(move || {
                while let Ok(work) = receiver.recv() {
                    match work {
                        Work::Search(job) => {
                            let result = execute_search(&path, &job);
                            worker_registry
                                .lock()
                                .expect("检索锁被污染")
                                .remove(&job.key);
                            let _ = job.reply.blocking_send(result);
                        }
                        Work::Stop(reply) => {
                            let _ = reply.send(());
                            return;
                        }
                    }
                }
            })?;
        Ok(Self {
            sender,
            registry,
            closed,
            generation,
            thread: Mutex::new(Some(thread)),
        })
    }

    pub async fn search(
        &self,
        window: String,
        request: ChatSearchRequest,
    ) -> AppResult<SearchPage> {
        validate_search(&request)?;
        if request.data_generation_id != self.generation {
            return Err(AppError::new(
                ErrorCode::DataGenerationChanged,
                "数据运行世代已改变，请重新检索。",
            ));
        }
        if self.closed.load(Ordering::Acquire) {
            return Err(AppError::new(
                ErrorCode::ShuttingDown,
                "应用正在退出，未开始新的检索。",
            ));
        }
        let key = (window, request.search_id.clone());
        let control = Arc::new(SearchControl {
            cancelled: AtomicBool::new(false),
            deadline: Instant::now() + Duration::from_secs(2),
            interrupt: Mutex::new(None),
        });
        {
            let mut registry = self.registry.lock().expect("检索锁被污染");
            if registry.contains_key(&key) {
                return Err(AppError::invalid(
                    "search_id",
                    "此检索标识正在使用，请等待或取消。",
                ));
            }
            registry.insert(key.clone(), control.clone());
        }
        let (reply, mut receiver) = tauri::async_runtime::channel(1);
        if let Err(error) = self.sender.try_send(Work::Search(SearchJob {
            request,
            key: key.clone(),
            control,
            reply,
        })) {
            self.registry.lock().expect("检索锁被污染").remove(&key);
            return Err(match error {
                mpsc::TrySendError::Full(_) => AppError::new(
                    ErrorCode::Backpressure,
                    "检索队列已满，请取消不需要的检索后重试。",
                ),
                mpsc::TrySendError::Disconnected(_) => {
                    AppError::new(ErrorCode::ShuttingDown, "检索工作线程已关闭。")
                }
            });
        }
        receiver.recv().await.unwrap_or_else(|| {
            Err(AppError::new(
                ErrorCode::ShuttingDown,
                "检索工作线程已关闭。",
            ))
        })
    }

    pub fn cancel(
        &self,
        window: &str,
        request: CancelSearchRequest,
    ) -> AppResult<CancelSearchResult> {
        validate_id(&request.search_id, "search_id")?;
        if request.data_generation_id != self.generation {
            return Err(AppError::new(
                ErrorCode::DataGenerationChanged,
                "数据运行世代已改变，请重新读取。",
            ));
        }
        let control = self
            .registry
            .lock()
            .expect("检索锁被污染")
            .get(&(window.to_owned(), request.search_id.clone()))
            .cloned();
        if let Some(control) = &control {
            control.cancelled.store(true, Ordering::Release);
            if let Some(interrupt) = control.interrupt.lock().expect("检索锁被污染").as_ref()
            {
                interrupt.interrupt();
            }
        }
        Ok(CancelSearchResult {
            search_id: request.search_id,
            cancellation_requested: control.is_some(),
        })
    }

    pub fn cancel_all(&self) {
        for control in self.registry.lock().expect("检索锁被污染").values() {
            control.cancelled.store(true, Ordering::Release);
            if let Some(interrupt) = control.interrupt.lock().expect("检索锁被污染").as_ref()
            {
                interrupt.interrupt();
            }
        }
    }

    pub fn shutdown(&self, deadline: Instant) -> AppResult<()> {
        self.cancel_all();
        let (reply, receiver) = mpsc::channel();
        let mut work = Work::Stop(reply);
        loop {
            match self.sender.try_send(work) {
                Ok(()) => break,
                Err(mpsc::TrySendError::Disconnected(_)) => return Ok(()),
                Err(mpsc::TrySendError::Full(returned)) => {
                    work = returned;
                    if Instant::now() >= deadline {
                        return Err(AppError::new(
                            ErrorCode::ShuttingDown,
                            "检索关闭超过等待上限。",
                        ));
                    }
                    thread::sleep(Duration::from_millis(10));
                }
            }
        }
        receiver
            .recv_timeout(deadline.saturating_duration_since(Instant::now()))
            .map_err(|_| AppError::new(ErrorCode::ShuttingDown, "检索关闭超过等待上限。"))?;
        if let Some(thread) = self.thread.lock().expect("工作线程锁被污染").take() {
            let _ = thread.join();
        }
        Ok(())
    }
}
