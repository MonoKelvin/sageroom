mod decision;
mod style;

use std::{
    collections::{HashMap, HashSet},
    future::pending,
    sync::{Arc, Mutex},
    time::Duration,
};

use genai::chat::ReasoningEffort;
use tokio::sync::{broadcast, watch};
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

use crate::{
    domain::{
        contracts::*,
        error::{AppResult, now_ms},
    },
    models::ModelGateway,
    secrets::store::SecretStore,
    storage::{runtime::{RuntimeExperience, RuntimeMessage}, worker::DbWorker},
};
use decision::Participation;

#[derive(Clone)]
enum RuntimeEvent {
    Domain(DomainEvent),
    Restart(String),
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum ReconcileTrigger {
    Configuration,
    GlobalConfiguration,
    NewMessage,
    ContentChanged,
}

#[derive(Clone)]
struct Opportunity {
    chain_id: String,
    reason: &'static str,
    message_seq: DecimalString,
    mention_seq: DecimalString,
}

struct CompletedDecision {
    decision: decision::Decision,
    validated_at: i64,
    observed_through_seq: DecimalString,
}

/// 决策请求的重试方向：格式修复，或首次过长时的口语化拆分。
#[derive(Clone, Copy, PartialEq, Eq)]
enum RetryKind {
    Repair,
    Split,
}

/// 房间共享的冷场间隔，随实际聊天频率缓慢调整。
pub struct IdleClock {
    last_message_at: Option<i64>,
    target_ms: u64,
}

impl IdleClock {
    // 冷场目标只用来决定「多久没说话算一次机会」，不再随空档一路拉长到 45 分钟；
    // 否则一次长假会让智能体之后再也不主动开口，正是用户看到的长时间冷场。
    // 真实数据显示白天冷场仍达 50–74 分钟：三个成员各自乘活动系数与 miss 放大后过长，
    // 这里把基线与上限一起收紧，让「一次长假」与「常态冷场处在同一量级」。
    const INITIAL_MS: u64 = 2 * 60_000;
    const MIN_MS: u64 = 60_000;
    const MAX_MS: u64 = 5 * 60_000;
    /// 小于此间隔视为连续对话，不计入冷场统计。
    const MIN_GAP_MS: i64 = 30_000;

    pub const fn new() -> Self {
        Self { last_message_at: None, target_ms: Self::INITIAL_MS }
    }

    /// 记录一次有人说话（含自己），并用本次冷场时长修正目标间隔。
    pub fn observe(&mut self, at: i64) {
        if let Some(previous) = self.last_message_at {
            let gap = at.saturating_sub(previous);
            if gap >= Self::MIN_GAP_MS {
                self.adjust(gap as u64);
            }
        }
        self.last_message_at = Some(at);
    }

    fn adjust(&mut self, observed: u64) {
        let target = self.target_ms as i64;
        let observed = observed.min(Self::MAX_MS) as i64;
        let next = target + (observed - target) / 3;
        self.target_ms = next.clamp(Self::MIN_MS as i64, Self::MAX_MS as i64) as u64;
    }

    pub fn target_ms(&self) -> u64 {
        self.target_ms
    }
}

/// 单房间场景：所有智能体共享同一份冷场时钟。
static IDLE_CLOCK: Mutex<IdleClock> = Mutex::new(IdleClock::new());

fn idle_target_ms() -> u64 {
    IDLE_CLOCK.lock().expect("冷场时钟锁被污染").target_ms()
}

fn observe_message_activity() {
    IDLE_CLOCK.lock().expect("冷场时钟锁被污染").observe(now_ms());
}

/// 按活跃度缩放房间冷场目标，并加入随机抖动。
/// 活跃度 100 约 ×0.6，50 约 ×1.0，0 约 ×1.4；睡眠时再放宽一点。
fn idle_interval_ms(activity: u8, target_ms: u64, seed: u64, sleeping: bool, misses: u32) -> u64 {
    let activity = i64::from(activity.min(100));
    // 原先低活跃按 1.4 倍、高活跃 0.6 倍放大；静默门槛收紧后收敛系数，
    // 避免三个成员的「看一眼」机会错开成十分钟的真空。
    let factor = 1.0 + (50 - activity) as f64 / 100.0 * 0.4;
    let base = (target_ms as f64 * factor) as u64;
    let jitter = seed % (base / 4 + 1);
    let interval = base + jitter;
    // sleep/defer 是成员明确要求休息，放宽到 2 倍；普通 observe 不再叠加延迟。
    let interval = if sleeping { interval * 2 } else { interval };
    // miss 只表示「这次没话说」，不表示用户离开了。原公式最多放大到 2 倍，
    // 与冷却门控叠加后会滚成半小时以上的真空；这里最多放慢 25%。
    let interval = interval.saturating_mul(u64::from(4 + misses.min(2))) / 4;
    interval.clamp(30_000, 10 * 60_000)
}

fn random_seed() -> u64 {
    Uuid::now_v7().as_u128() as u64
}

fn reading_delay_ms(addressed: bool, seed: u64) -> u64 {
    if addressed { 800 + seed % 2200 } else { 1500 + seed % 7000 }
}

/// 空闲触发概率：高活跃成员几乎每次空闲机会都会真正去看一眼有没有可聊的，
/// 是否发言仍由模型决定；低活跃成员保持克制。
fn idle_trigger_chance(activity: u8) -> u64 {
    // 原下限 20% 意味着低活跃成员平均每 5 次空闲才真正看一眼，
    // 叠上间隔后白天空档轻易超过半小时；提高到至少一半机会会去看，
    // 说不说仍由模型决定，不会强制发言。
    50 + u64::from(activity.min(100)) * 45 / 100
}

struct Actor {
    revision: DecimalString,
    content_epoch: DecimalString,
    credential_ref: Option<String>,
    cancellation: CancellationToken,
    opportunities: watch::Sender<Opportunity>,
}

pub struct RuntimeSupervisor {
    events: broadcast::Sender<RuntimeEvent>,
    cancellation: Mutex<CancellationToken>,
}

impl RuntimeSupervisor {
    pub fn new() -> Arc<Self> {
        let (events, _) = broadcast::channel(128);
        Arc::new(Self {
            events,
            cancellation: Mutex::new(CancellationToken::new()),
        })
    }
    pub fn publish(&self, event: &DomainEvent) {
        let _ = self.events.send(RuntimeEvent::Domain(event.clone()));
    }
    pub fn restart_agent(&self, id: String) {
        let _ = self.events.send(RuntimeEvent::Restart(id));
    }
    pub fn shutdown(&self) {
        self.cancellation
            .lock()
            .expect("运行器取消锁被污染")
            .cancel();
    }

    pub fn start(
        self: &Arc<Self>,
        worker: Arc<DbWorker>,
        models: AppResult<Arc<ModelGateway>>,
        secrets: AppResult<Arc<SecretStore>>,
    ) {
        self.shutdown();
        let cancellation = CancellationToken::new();
        *self.cancellation.lock().expect("运行器取消锁被污染") = cancellation.clone();
        let mut events = self.events.subscribe();
        tauri::async_runtime::spawn(async move {
            let mut actors = HashMap::new();
            if reconcile(
                &worker,
                &models,
                &secrets,
                &cancellation,
                &mut actors,
                None,
                ReconcileTrigger::Configuration,
            )
            .await
            .is_err()
            {
                return;
            }
            loop {
                let event = tokio::select! {biased; _=cancellation.cancelled()=>break, event=events.recv()=>event};
                match event {
                    Ok(RuntimeEvent::Restart(id)) => {
                        let _ = reconcile(
                            &worker,
                            &models,
                            &secrets,
                            &cancellation,
                            &mut actors,
                            Some(&id),
                            ReconcileTrigger::Configuration,
                        )
                        .await;
                    }
                    Ok(RuntimeEvent::Domain(event)) => match event.payload {
                        EventPayload::AgentConfigurationChanged { .. } => {
                            let _ = reconcile(
                                &worker,
                                &models,
                                &secrets,
                                &cancellation,
                                &mut actors,
                                None,
                                ReconcileTrigger::Configuration,
                            )
                            .await;
                        }
                        EventPayload::GlobalConfigurationChanged { .. } => {
                            let _ = reconcile(
                                &worker,
                                &models,
                                &secrets,
                                &cancellation,
                                &mut actors,
                                None,
                                ReconcileTrigger::GlobalConfiguration,
                            )
                            .await;
                        }
                        EventPayload::MessageChanged { .. } => {
                            for actor in actors.values() {
                                actor.cancellation.cancel();
                            }
                            let _ = reconcile(
                                &worker,
                                &models,
                                &secrets,
                                &cancellation,
                                &mut actors,
                                None,
                                ReconcileTrigger::ContentChanged,
                            )
                            .await;
                        }
                        EventPayload::MessageCommitted {
                            message_seq,
                            sender_id,
                            ..
                        } => {
                            // 有人说话：刷新冷场时钟，动态学习房间的自然对话间隔。
                            observe_message_activity();
                            let chain_id = worker
                                .runtime_chain(message_seq.clone())
                                .await
                                .unwrap_or_else(|_| Uuid::now_v7().to_string());
                            let page = worker
                                .list_messages(ChatListRequest {
                                    data_generation_id: event.data_generation_id.clone(),
                                    before_seq: None,
                                    after_seq: None,
                                    around_seq: Some(message_seq.clone()),
                                    limit: 1,
                                })
                                .await;
                            let mentions = page
                                .ok()
                                .and_then(|p| p.items.into_iter().next())
                                .map(|m| (m.mention_ids, m.mention_all, m.quote_message_id))
                                .unwrap_or_default();
                            let quote_sender = if let Some(id) = &mentions.2 {
                                worker.resolve_quotes(ChatResolveQuotesRequest {
                                    data_generation_id: event.data_generation_id,
                                    message_ids: vec![id.clone()],
                                }).await.ok().and_then(|messages| messages.into_iter().next()).map(|message| message.sender_id)
                            } else {
                                None
                            };
                            if actors.values().any(|actor| actor.opportunities.is_closed()) {
                                let _ = reconcile(
                                    &worker,
                                    &models,
                                    &secrets,
                                    &cancellation,
                                    &mut actors,
                                    None,
                                    ReconcileTrigger::NewMessage,
                                )
                                .await;
                            }
                            for (id, actor) in &actors {
                                if id != &sender_id {
                                    let mention_seq = if mentions.1 || mentions.0.contains(id) || quote_sender.as_ref() == Some(id) {
                                        message_seq.clone()
                                    } else {
                                        actor.opportunities.borrow().mention_seq.clone()
                                    };
                                    actor.opportunities.send_replace(Opportunity {
                                        chain_id: chain_id.clone(),
                                        reason: "new_message",
                                        message_seq: message_seq.clone(),
                                        mention_seq,
                                    });
                                }
                            }
                        }
                        _ => {}
                    },
                    Err(broadcast::error::RecvError::Lagged(_)) => {
                        if let Ok(snapshot) = worker
                            .snapshot(AppSnapshotRequest {
                                data_generation_id: None,
                                last_event_seq: None,
                            })
                            .await
                        {
                            let chain = worker
                                .runtime_chain(snapshot.latest_message_seq.clone())
                                .await
                                .unwrap_or_else(|_| Uuid::now_v7().to_string());
                            for (id, actor) in &actors {
                                let previous = actor.opportunities.borrow().clone();
                                let mention_seq = worker
                                    .runtime_mention_seq(id.clone(), previous.message_seq.clone())
                                    .await
                                    .unwrap_or_else(|_| previous.mention_seq.clone());
                                actor.opportunities.send_replace(Opportunity {
                                    chain_id: chain.clone(),
                                    reason: "resynchronize",
                                    message_seq: snapshot.latest_message_seq.clone(),
                                    mention_seq: if sequence(&mention_seq)
                                        > sequence(&previous.mention_seq)
                                    {
                                        mention_seq
                                    } else {
                                        previous.mention_seq
                                    },
                                });
                            }
                        }
                        let _ = reconcile(
                            &worker,
                            &models,
                            &secrets,
                            &cancellation,
                            &mut actors,
                            None,
                            ReconcileTrigger::Configuration,
                        )
                        .await;
                    }
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
            for actor in actors.values() {
                actor.cancellation.cancel();
            }
        });
    }
}

async fn reconcile(
    worker: &Arc<DbWorker>,
    models: &AppResult<Arc<ModelGateway>>,
    secrets: &AppResult<Arc<SecretStore>>,
    shutdown: &CancellationToken,
    actors: &mut HashMap<String, Actor>,
    restart: Option<&str>,
    trigger: ReconcileTrigger,
) -> AppResult<()> {
    let force = trigger == ReconcileTrigger::GlobalConfiguration;
    let snapshot = worker
        .snapshot(AppSnapshotRequest {
            data_generation_id: None,
            last_event_seq: None,
        })
        .await?;
    let configurations = worker
        .list_agents(AgentListRequest {
            data_generation_id: snapshot.data_generation_id,
        })
        .await?;
    let ids: HashSet<_> = configurations.iter().map(|a| a.agent_id.clone()).collect();
    actors.retain(|id, actor| {
        if ids.contains(id) {
            true
        } else {
            actor.cancellation.cancel();
            false
        }
    });
    for agent in configurations {
        if shutdown.is_cancelled() {
            break;
        }
        let paused = worker.runtime_is_paused(agent.agent_id.clone()).await?;
        let protected = snapshot
            .participants
            .iter()
            .find(|p| p.id == agent.agent_id)
            .and_then(|p| p.runtime.as_ref())
            .is_some_and(|s| {
                s.config_revision == agent.revision && s.status == AgentRuntimeStatus::Protected
            });
        if paused || (protected && restart != Some(agent.agent_id.as_str())) {
            if let Some(old) = actors.remove(&agent.agent_id) {
                old.cancellation.cancel();
            }
            continue;
        }
        let credential_ref = if force || !actors.contains_key(&agent.agent_id) {
            worker
                .runtime_input(agent.agent_id.clone())
                .await
                .ok()
                .map(|input| input.credential_ref)
        } else {
            actors
                .get(&agent.agent_id)
                .and_then(|actor| actor.credential_ref.clone())
        };
        let binding_changed = force
            && actors
                .get(&agent.agent_id)
                .is_some_and(|actor| actor.credential_ref != credential_ref);
        let content_changed = actors
            .get(&agent.agent_id)
            .is_some_and(|actor| actor.content_epoch != snapshot.room.content_epoch);
        let unchanged = actors.get(&agent.agent_id).is_some_and(|a| {
            a.revision == agent.revision
                && !a.opportunities.is_closed()
                && !a.cancellation.is_cancelled()
        });
        if unchanged
            && !binding_changed
            && !content_changed
            && restart != Some(agent.agent_id.as_str())
        {
            continue;
        }
        if let Some(old) = actors.remove(&agent.agent_id) {
            old.cancellation.cancel();
        }
        if agent.model.is_none() || agent.agent_type == AgentType::Tool {
            let detail = if agent.agent_type == AgentType::Tool {
                "工具任务尚未启用，工具成员不会参与自主闲聊。"
            } else {
                "请在该成员中采用完整模型预设并设置凭据。"
            };
            let _ = worker
                .set_runtime_state(AgentRuntimeState {
                    agent_id: agent.agent_id,
                    config_revision: agent.revision,
                    status: AgentRuntimeStatus::NeedsConfiguration,
                    detail: Some(detail.into()),
                    next_wake_at: None,
                    requests_today: 0,
                })
                .await;
            continue;
        }
        if actors
            .values()
            .filter(|a| !a.opportunities.is_closed())
            .count()
            >= 4
        {
            let _ = worker
                .set_runtime_state(AgentRuntimeState {
                    agent_id: agent.agent_id,
                    config_revision: agent.revision,
                    status: AgentRuntimeStatus::Protected,
                    detail: Some("最多同时运行四位社交成员，请暂停其他成员后恢复。".into()),
                    next_wake_at: None,
                    requests_today: 0,
                })
                .await;
            continue;
        }
        let cancellation = shutdown.child_token();
        let opportunity = Opportunity {
            chain_id: Uuid::now_v7().to_string(),
            reason: "initialized",
            message_seq: 0.into(),
            mention_seq: 0.into(),
        };
        let (opportunities, receiver) = watch::channel(opportunity);
        actors.insert(
            agent.agent_id.clone(),
            Actor {
                revision: agent.revision.clone(),
                content_epoch: snapshot.room.content_epoch.clone(),
                credential_ref,
                cancellation: cancellation.clone(),
                opportunities,
            },
        );
        let worker = worker.clone();
        let models = models.clone();
        let secrets = secrets.clone();
        let restore = !binding_changed && restart.is_none();
        tauri::async_runtime::spawn(async move {
            run_actor(
                agent,
                worker,
                (models, secrets),
                receiver,
                cancellation,
                restore,
                trigger == ReconcileTrigger::NewMessage
                    || trigger == ReconcileTrigger::ContentChanged
                    || content_changed,
            )
            .await;
        });
    }
    Ok(())
}

async fn state(
    worker: &DbWorker,
    agent: &AgentConfiguration,
    status: AgentRuntimeStatus,
    detail: Option<String>,
    next_wake_at: Option<i64>,
    requests_today: u32,
    cancellation: &CancellationToken,
) -> AppResult<()> {
    if cancellation.is_cancelled() {
        return Err(AppError::new(ErrorCode::ShuttingDown, "智能体请求已取消。"));
    }
    worker
        .set_runtime_state(AgentRuntimeState {
            agent_id: agent.agent_id.clone(),
            config_revision: agent.revision.clone(),
            status,
            detail,
            next_wake_at,
            requests_today,
        })
        .await?;
    Ok(())
}

async fn run_actor(
    agent: AgentConfiguration,
    worker: Arc<DbWorker>,
    services: (AppResult<Arc<ModelGateway>>, AppResult<Arc<SecretStore>>),
    mut opportunities: watch::Receiver<Opportunity>,
    cancellation: CancellationToken,
    restore: bool,
    wait_for_opportunity: bool,
) {
    let (models, secrets) = services;
    let stored = worker
        .runtime_states()
        .await
        .ok()
        .and_then(|s| s.into_iter().find(|s| s.agent_id == agent.agent_id));
    let mut count = stored.as_ref().map(|s| s.requests_today).unwrap_or(0);
    let mut next = worker
        .runtime_plan(agent.agent_id.clone())
        .await
        .ok()
        .flatten()
        .filter(|(_, _, revision)| restore && revision == &agent.revision);
    let mut sleeping = restore
        && stored.as_ref().is_some_and(|s| {
            s.config_revision == agent.revision && s.status == AgentRuntimeStatus::Sleeping
        });
    let restored_idle = restore
        && stored.as_ref().is_some_and(|s| {
            s.config_revision == agent.revision
                && matches!(
                    s.status,
                    AgentRuntimeStatus::Observing | AgentRuntimeStatus::Sleeping
                )
        });
    let mut observed_through_seq = DecimalString::from(0);
    let mut opportunity = if next.is_none() && !restored_idle && !wait_for_opportunity {
        Some(opportunities.borrow_and_update().clone())
    } else {
        None
    };
    if opportunity.is_none()
        && state(
            &worker,
            &agent,
            if sleeping {
                AgentRuntimeStatus::Sleeping
            } else {
                AgentRuntimeStatus::Observing
            },
            None,
            next.as_ref().map(|(at, _, _)| *at),
            count,
            &cancellation,
        )
        .await
        .is_err()
    {
        return;
    }
    // 空闲自主发起：无人说话时，按活跃度概率主动开启话题，而不是只等着接话。
    let activity = agent.dimensions.activity;
    // 连续「被叫醒但选择沉默」的次数，用于逐步放慢下一次空闲发起。
    let mut idle_misses: u32 = 0;
    let mut idle_at = tokio::time::Instant::now()
        + Duration::from_millis(idle_interval_ms(activity, idle_target_ms(), random_seed(), sleeping, idle_misses));
    loop {
        if cancellation.is_cancelled() {
            break;
        }
        if opportunity.is_none() {
            let due = next.as_ref().map(|(at, _, _)| {
                tokio::time::Instant::now()
                    + Duration::from_millis(at.saturating_sub(now_ms()).max(0) as u64)
            });
            opportunity = tokio::select! {
                biased;
                _=cancellation.cancelled()=>break,
                changed=opportunities.changed()=>{
                    if changed.is_err(){break;}
                    let incoming=opportunities.borrow_and_update().clone();
                    // 有真实新消息时重置空闲计时，避免刚聊过又主动插话。
                    idle_at = tokio::time::Instant::now()
                        + Duration::from_millis(idle_interval_ms(activity, idle_target_ms(), random_seed(), sleeping, idle_misses));
                    if sequence(&incoming.message_seq) <= sequence(&observed_through_seq)
                        || (sleeping && sequence(&incoming.mention_seq) <= sequence(&observed_through_seq)) {continue;}
                    Some(incoming)
                },
                _=async {if let Some(due)=due{tokio::time::sleep_until(due).await}else{pending::<()>().await}}=>{
                    let chain=next.take().expect("定时器必须对应计划").1;
                    match worker.reserve_runtime_wake(agent.agent_id.clone()).await {
                        Ok(Some(at))=>{
                            next=Some((at,chain.clone(),agent.revision.clone()));
                            let _=worker.save_runtime_plan(agent.agent_id.clone(),agent.revision.clone(),Some(at),chain).await;
                            sleeping = true;
                            idle_at = tokio::time::Instant::now()
                                + Duration::from_millis(idle_interval_ms(activity, idle_target_ms(), random_seed(), sleeping, idle_misses));
                            let _=state(&worker,&agent,AgentRuntimeStatus::Sleeping,Some("自主检查已达到两次/滚动小时，将按既有计划稍后继续。".into()),Some(at),count,&cancellation).await;
                            continue;
                        },
                        Ok(None)=>Some(Opportunity{chain_id:chain,reason:"planned_wake",message_seq:observed_through_seq.clone(),mention_seq:0.into()}),
                        Err(error)=>{report_failure(&worker,&agent,error,count,&cancellation).await;break;}
                    }
                }
                _=tokio::time::sleep_until(idle_at)=>{
                    let seed = random_seed();
                    idle_at = tokio::time::Instant::now()
                        + Duration::from_millis(idle_interval_ms(activity, idle_target_ms(), seed, sleeping, idle_misses));
                    // 按活跃度概率决定这一次是否真的主动开口；没中就先跳过。
                    if seed % 100 >= idle_trigger_chance(activity) { continue; }
                    Some(Opportunity{
                        chain_id: Uuid::now_v7().to_string(),
                        reason: "idle_tick",
                        message_seq: observed_through_seq.clone(),
                        mention_seq: 0.into(),
                    })
                }
            };
        }
        let addressed = opportunity.as_ref().is_some_and(|current| sequence(&current.mention_seq) > sequence(&observed_through_seq));
        let anchor = tokio::time::Instant::now()
            + Duration::from_millis(reading_delay_ms(addressed, random_seed()));
        while tokio::time::Instant::now() < anchor {
            tokio::select! {biased;_=cancellation.cancelled()=>return,_=tokio::time::sleep_until(anchor)=>break,changed=opportunities.changed()=>{if changed.is_err(){return;}opportunity=Some(opportunities.borrow_and_update().clone());}}
        }
        let current = opportunity.take().expect("需要有效观察机会");
        // 被空闲机会叫醒却选择沉默时，下一次要更晚打扰。
        let idle_opportunity = current.reason == "idle_tick";
        let _ = worker
            .save_runtime_plan(
                agent.agent_id.clone(),
                agent.revision.clone(),
                None,
                current.chain_id.clone(),
            )
            .await;
        next = None;
        let decision_cancellation = cancellation.child_token();
        let result = tokio::select! {
            biased;
            _=cancellation.cancelled()=>return,
            changed=opportunities.changed()=>{
                decision_cancellation.cancel();
                if changed.is_err() { return; }
                opportunity = Some(opportunities.borrow_and_update().clone());
                Err(AppError::new(ErrorCode::ConfigConflict, "有新消息，停止旧候选并重新观察。"))
            },
            result=make_decision(&agent, &worker, &models, &secrets, &current,
                &observed_through_seq, &decision_cancellation, &mut count)=>result,
        };
        let completed = match result {
            Ok(completed) => completed,
            Err(error) if error.code == ErrorCode::ConfigConflict => {
                report_failure(&worker, &agent, error, count, &cancellation).await;
                continue;
            }
            Err(error) => {
                report_failure(&worker, &agent, error, count, &cancellation).await;
                let blocking = matches!(
                    worker.runtime_states().await.ok()
                        .and_then(|states| states.into_iter().find(|s| s.agent_id == agent.agent_id))
                        .map(|s| s.status),
                    Some(AgentRuntimeStatus::NeedsConfiguration | AgentRuntimeStatus::Paused | AgentRuntimeStatus::Protected)
                );
                if blocking || cancellation.is_cancelled() {
                    return;
                }
                tokio::select! {
                    biased;
                    _=cancellation.cancelled()=>return,
                    _=tokio::time::sleep(Duration::from_secs(30))=>{}
                }
                idle_at = tokio::time::Instant::now()
                    + Duration::from_millis(idle_interval_ms(activity, idle_target_ms(), random_seed(), false, idle_misses));
                continue;
            }
        };
        if cancellation.is_cancelled() {
            return;
        }
        observed_through_seq = completed.observed_through_seq;
        let decision = completed.decision;
        sleeping = matches!(
            decision.participation,
            Participation::Sleep | Participation::Defer
        );
        // 只有「看了却主动选择沉默」才算一次 miss；话题饱和被门控压下的 observe
        // 不该让下次更晚打扰，否则「越没话说→越不问→越冷场」会自我强化。
        idle_misses = if idle_opportunity && decision.participation == Participation::Observe {
            (idle_misses + 1).min(2)
        } else if decision.participation == Participation::Observe {
            idle_misses
        } else {
            0
        };
        idle_at = tokio::time::Instant::now()
            + Duration::from_millis(idle_interval_ms(activity, idle_target_ms(), random_seed(), sleeping, idle_misses));
        if let Some(plan) = decision.wake_plan {
            let at = completed
                .validated_at
                .saturating_add((plan.after_seconds * 1000) as i64);
            if worker
                .save_runtime_plan(
                    agent.agent_id.clone(),
                    agent.revision.clone(),
                    Some(at),
                    current.chain_id.clone(),
                )
                .await
                .is_err()
            {
                return;
            }
            next = Some((at, current.chain_id, agent.revision.clone()));
        }
        let status = if sleeping {
            AgentRuntimeStatus::Sleeping
        } else {
            AgentRuntimeStatus::Observing
        };
        if state(
            &worker,
            &agent,
            status,
            None,
            next.as_ref().map(|(at, _, _)| *at),
            count,
            &cancellation,
        )
        .await
        .is_err()
        {
            break;
        }
    }
}

/// 消费模型自评的 `topic_fatigue`：代码只做阈值收敛，不做本地字符串分析。
/// 被明确 @ 时只压条数，不剥夺回应义务。
fn apply_topic_fatigue(decision: &mut decision::Decision, addressed: bool) {
    let fatigue = decision.topic_fatigue.unwrap_or(0);
    if fatigue >= 80 && !addressed {
        // 旧版直接 Observe：模型一旦判疲劳就彻底沉默，是冷场的另一来源。
        // 改为只留一条，逼这句必须是新话题或新信息。
        decision.messages.truncate(1);
    } else if fatigue >= 60 && decision.messages.len() > 1 {
        decision.messages.truncate(1);
    }
}

/// 本地门控：模型自评的疲劳度不可靠，用最近消息客观限流。
/// 关键修正：饱和不再强制沉默，而是压到一条并靠 `saturated_topics` 引导换话题。
/// 这与冷场目标一致——要少说废话，不是少说话；只有纯复读才真正闭嘴。
/// 被明确 @ 时只压条数，不剥夺回应义务。
fn apply_local_gate(decision: &mut decision::Decision, input: &crate::storage::runtime::RuntimeInput, addressed: bool) {
    let saturation = decision::local_saturation(input, now_ms());
    if addressed {
        // 被点名时必须给完整回应：压条数会直接表现成「问一句答半句」。
        // 只有连续复读才收一收，而且保留最有信息的那条。
        if saturation.repeated >= 3 { decision.messages.truncate(1) }
        return;
    }
    // 完全复读是最强的沉默信号；但要连续三次以上，避免两人同频时全体噤声。
    if saturation.repeated >= 3 {
        decision.participation = Participation::Observe;
        decision.messages.clear();
        return;
    }
    if saturation.repeated >= 2 || saturation.hot >= 8 {
        decision.messages.truncate(1);
    }
    // 空闲机会本来就是主动起话，话题饱和时更该换个新话题，而不是直接放弃这次机会。
}

async fn make_decision(
    agent: &AgentConfiguration,
    worker: &Arc<DbWorker>,
    models: &AppResult<Arc<ModelGateway>>,
    secrets: &AppResult<Arc<SecretStore>>,
    opportunity: &Opportunity,
    observed_through_seq: &DecimalString,
    cancellation: &CancellationToken,
    count: &mut u32,
) -> AppResult<CompletedDecision> {
    let mut input = worker.runtime_input(agent.agent_id.clone()).await?;
    if input.agent.revision != agent.revision {
        return Err(AppError::new(ErrorCode::ConfigConflict, "成员配置已改变。"));
    }
    let addressed = sequence(&opportunity.mention_seq) > sequence(observed_through_seq)
        || decision::addressed_since(&input, observed_through_seq);
    if (opportunity.reason == "initialized" && !input.messages.is_empty())
        || (matches!(opportunity.reason, "new_message" | "resynchronize")
            && random_seed() % 100 >= decision::participation_chance(&input, addressed, now_ms()))
    {
        return Ok(CompletedDecision {
            decision: decision::parse(r#"{"participation":"observe"}"#, &input)?,
            validated_at: now_ms(),
            observed_through_seq: if matches!(opportunity.reason, "new_message" | "resynchronize") {
                sequence(&opportunity.message_seq).min(sequence(&input.snapshot.latest_message_seq)).into()
            } else {
                input.snapshot.latest_message_seq.clone()
            },
        });
    }
    let source = input.agent.model.as_ref().expect("模型已由运行输入校验");
    let endpoint = source.profile.base_url.clone();
    let protocol = source.profile.protocol.clone();
    let reference = input.credential_ref.clone();
    let secrets = secrets.clone()?;
    let news_secrets = secrets.clone();
    let key = tauri::async_runtime::spawn_blocking(move || {
        secrets.read(&reference, &endpoint, &protocol)
    })
    .await
    .map_err(|_| AppError::new(ErrorCode::InternalError, "读取成员凭据未完成。"))??;
    let model = ModelProfile {
        id: source.profile.id.clone(),
        name: source.profile.name.clone(),
        protocol: source.profile.protocol.clone(),
        base_url: source.profile.base_url.clone(),
        model_name: source.profile.model_name.clone(),
        revision: source.source_profile_revision.clone(),
        credential_configured: true,
    };
    let policy = style::for_input(&input, opportunity.reason);
    // 先让模型判断需不需要搜索，不再预先抓取固定主题的新闻。
    let generation = input.snapshot.data_generation_id.clone();
    let news_state = worker
        .call(move |database| database.get_news_configuration(&generation))
        .await
        .ok();
    let news_enabled = news_state.as_ref().is_some_and(|state| state.configuration.enabled);
    let (system, base_context) = decision::context(&mut input, opportunity.reason, observed_through_seq, &policy, &[])?;
    let mut context = decision::news_context(&base_context, news_enabled, None)?;
    let gateway = models.clone()?;
    let mut decision = None;
    let mut searched = false;
    let mut charge_next = true;
    let mut refinement_attempt = 0;
    // 一次查询与回看结果；原有格式修复/精简仍最多两轮。
    let mut retry: Option<RetryKind> = None;
    let mut fallback: Option<decision::Decision> = None;
    let mut refinement_prompt = None;
    for attempt in 0..4 {
        if cancellation.is_cancelled() {
            return Err(AppError::new(ErrorCode::ShuttingDown, "成员请求已取消。"));
        }
        // 没有搜索时沿用三次调用上限；执行一次搜索最多增加一次结果判断。
        if !searched && attempt == 3 { break; }
        // 查询后的结果判断是新的模型调用，也计入额度；格式修复不重复计数。
        if charge_next {
            *count = worker
                .reserve_runtime_request(agent.agent_id.clone(), DAILY_REQUEST_LIMIT)
                .await?;
            charge_next = false;
        }
        state(
            worker,
            agent,
            AgentRuntimeStatus::Deciding,
            None,
            None,
            *count,
            cancellation,
        )
        .await?;
        let prompt = match retry {
            Some(RetryKind::Repair) => format!("{context}
{}", decision::repair_hint()),
            Some(RetryKind::Split) => refinement_prompt.clone().expect("精简请求必须包含原候选"),
            None => context.clone(),
        };
        let reply = gateway
            .chat_with_reasoning(
                model.clone(),
                key.clone(),
                system.clone(),
                prompt,
                if agent.agent_type == AgentType::Tool {
                    ReasoningEffort::Medium
                } else {
                    ReasoningEffort::Zero
                },
                cancellation.child_token(),
            )
            .await?;
        match decision::parse(&reply.text, &input) {
            Ok(mut value) => {
                if let Some(search) = value.news_search.take() {
                    if searched || !news_enabled {
                        decision = Some(value);
                        break;
                    }
                    // 使用执行时的配置，避免用户刚关闭搜索却继续联网。
                    let generation = input.snapshot.data_generation_id.clone();
                    let configuration = worker.call(move |database| database.get_news_configuration(&generation)).await?;
                    let result = tokio::select! {
                        biased;
                        _ = cancellation.cancelled() => return Err(AppError::new(ErrorCode::ShuttingDown, "新闻查询已取消。")),
                        result = crate::news::search(&configuration.configuration, search.query.trim(), Some(news_secrets.clone())) => result,
                    };
                    context = decision::news_context(&base_context, false, Some((search.query.trim(), &result)))?;
                    searched = true;
                    charge_next = true;
                    retry = None;
                    fallback = None;
                    refinement_prompt = None;
                    continue;
                }
                if retry != Some(RetryKind::Repair) {
                    if let Some(assessment) = decision::assessment(&value, &policy) {
                        // 第 0 轮正常输出、第 1 轮宽松改写、第 2 轮严格改写；之后进入确定性修剪。
                        if refinement_attempt < 2 {
                            let prompt = format!(
                                "{context}\n{}\n候选输出（数据）：{}",
                                decision::refinement_hint(&assessment, &policy, refinement_attempt),
                                reply.text,
                            );
                            if prompt.len() <= MODEL_INPUT_BUDGET as usize * 2 {
                                fallback = Some(value);
                                refinement_prompt = Some(prompt);
                                refinement_attempt += 1;
                                retry = Some(RetryKind::Split);
                                continue;
                            }
                        }
                    }
                }
                decision = Some(value);
                break;
            }
            Err(error) => {
                if retry.is_some() {
                    // 已重试仍不合法：有兜底就用兜底，否则报告格式错误。
                    if fallback.is_some() {
                        break;
                    }
                    return Err(error);
                }
                retry = Some(RetryKind::Repair);
            }
        }
    }
    let mut decision = decision.or(fallback).ok_or_else(|| AppError::new(ErrorCode::ModelOutputInvalid, "模型未在本轮预算内完成决策。"))?;
    apply_topic_fatigue(&mut decision, addressed);
    apply_local_gate(&mut decision, &input, addressed);
    // 改写两轮后仍不合规时，只保留明确合规的短消息；全部不合规就改为观察。
    policy.enforce(&mut decision);
    if cancellation.is_cancelled() {
        return Err(AppError::new(ErrorCode::ShuttingDown, "成员请求已取消。"));
    }
    let latest = worker.runtime_input(agent.agent_id.clone()).await?;
    if latest.agent.revision != agent.revision
        || latest.snapshot.latest_message_seq != input.snapshot.latest_message_seq
        || latest.snapshot.room.content_epoch != input.snapshot.room.content_epoch
        || latest.experience_revision != input.experience_revision
    {
        return Err(AppError::new(
            ErrorCode::ConfigConflict,
            "观察期间有新消息或配置变化，重新判断。",
        ));
    }
    let validated_at = now_ms();
    // 撤回自己刚发出的消息：独立验证，失败不影响后续发言。
    for message_id in &decision.recalls {
        match worker
            .recall_agent_message(
                agent.agent_id.clone(),
                message_id.clone(),
                input.snapshot.data_generation_id.clone(),
            )
            .await
        {
            Ok(()) => {}
            Err(error)
                if matches!(
                    error.code,
                    ErrorCode::ConfigConflict | ErrorCode::ShuttingDown
                ) =>
            {
                return Err(error);
            }
            Err(error) => tracing::warn!(?error, "智能体撤回消息失败"),
        }
    }
    let mut observed_through_seq = input.snapshot.latest_message_seq.clone();
    let decision_id = (!decision.messages.is_empty()).then(|| Uuid::now_v7().to_string());
    if !decision.messages.is_empty() {
        state(
            worker,
            agent,
            AgentRuntimeStatus::WaitingToSend,
            None,
            None,
            *count,
            cancellation,
        )
        .await?;
        let anchor = tokio::time::Instant::now();
        let committed_decision_id = decision_id.as_ref().expect("发言决定必须包含标识");
        for (ordinal, message) in decision.messages.iter().enumerate() {
            tokio::select! {biased;_=cancellation.cancelled()=>return Err(AppError::new(ErrorCode::ShuttingDown,"待发消息已取消。")),_=tokio::time::sleep_until(anchor+Duration::from_millis(message.send_after_ms))=>{}}
            let sent = worker
                .commit_runtime_message(RuntimeMessage {
                    agent_id: agent.agent_id.clone(),
                    config_revision: agent.revision.clone(),
                    observed_through_seq: input.snapshot.latest_message_seq.clone(),
                    observed_content_epoch: input.snapshot.room.content_epoch.clone(),
                    observed_experience_revision: input.experience_revision.clone(),
                    decision_id: committed_decision_id.clone(),
                    ordinal: ordinal as u32,
                    chain_id: opportunity.chain_id.clone(),
                    parts: message.parts.clone(),
                    quote_message_id: message.quote_message_id.clone(),
                    mention_ids: message.mention_ids.clone(),
                    mention_all: message.mention_all,
                    cancellation: cancellation.clone(),
                })
                .await?;
            observed_through_seq = sent.message_seq;
        }
    }
    if let Some(experience) = &decision.experience {
        let result = worker.record_experience(RuntimeExperience {
            data_generation_id: input.snapshot.data_generation_id.clone(),
            agent_id: agent.agent_id.clone(),
            config_revision: agent.revision.clone(),
            observed_through_seq: input.snapshot.latest_message_seq.clone(),
            observed_content_epoch: input.snapshot.room.content_epoch.clone(),
            decision_id,
            experience_revision: input.experience_revision.clone(),
            content: experience.content.clone(),
            score: experience.score,
            cancellation: cancellation.clone(),
        }).await;
        if let Err(error) = result {
            if matches!(error.code, ErrorCode::ConfigConflict | ErrorCode::ShuttingDown) {
                return Err(error);
            }
            tracing::warn!(?error, "写入智能体经历失败");
        }
    }
    Ok(CompletedDecision {
        decision,
        validated_at,
        observed_through_seq,
    })
}

fn sequence(value: &DecimalString) -> i64 {
    value.0.parse().expect("内部消息序号必须有效")
}

async fn report_failure(
    worker: &DbWorker,
    agent: &AgentConfiguration,
    error: AppError,
    count: u32,
    cancellation: &CancellationToken,
) {
    if cancellation.is_cancelled() || error.code == ErrorCode::ShuttingDown {
        return;
    }
    let status = match error.code {
        // 频率/额度保护是暂时性的，降级为观察而不是永久停用。
        ErrorCode::Backpressure => AgentRuntimeStatus::Observing,
        // 本轮输出不合协议同样只影响这一轮：退回观察，等下一条消息再判断。
        ErrorCode::ModelOutputInvalid => AgentRuntimeStatus::Observing,
        ErrorCode::ConfigConflict => AgentRuntimeStatus::Observing,
        ErrorCode::PermissionDenied if !error.may_have_been_charged => {
            AgentRuntimeStatus::NeedsConfiguration
        }
        ErrorCode::InvalidInput | ErrorCode::CapabilityUnsupported => {
            AgentRuntimeStatus::NeedsConfiguration
        }
        _ => AgentRuntimeStatus::Offline,
    };
    let _ = state(
        worker,
        agent,
        status,
        Some(error.message),
        None,
        count,
        cancellation,
    )
    .await;
    let _ = worker
        .save_runtime_plan(
            agent.agent_id.clone(),
            agent.revision.clone(),
            None,
            Uuid::now_v7().to_string(),
        )
        .await;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::database::Database;
    use tempfile::TempDir;
    use tokio::sync::mpsc;

    async fn fixture() -> (
        TempDir,
        Arc<DbWorker>,
        AgentConfiguration,
        mpsc::UnboundedReceiver<DomainEvent>,
    ) {
        let directory = TempDir::new().unwrap();
        let (events, receiver) = mpsc::unbounded_channel();
        let worker = DbWorker::open(
            directory.path(),
            "actor-tests".into(),
            Arc::new(move |event| {
                let _ = events.send(event.clone());
            }),
        )
        .unwrap();
        let agent = worker
            .call(|database: &mut Database| {
                let global = database.get_global_configuration("actor-tests")?;
                let profile = ModelProfileInput {
                    id: "actor-test-model".into(),
                    name: "Actor fixture".into(),
                    protocol: ModelProtocol::OpenaiChatCompletions,
                    base_url: "https://actor.example.invalid/v1".into(),
                    model_name: "fixture".into(),
                };
                let global = database
                    .save_global_configuration(GlobalConfigurationSaveRequest {
                        data_generation_id: "actor-tests".into(),
                        client_request_id: Uuid::now_v7().to_string(),
                        expected_revision: global.revision,
                        model_profiles: vec![profile],
                        persona_presets: global.persona_presets,
                    })?
                    .0;
                database.replace_credential_reference(
                    &global.model_profiles[0].id,
                    &global.model_profiles[0].revision,
                    Some(Uuid::now_v7().to_string()),
                )?;
                let mut agent = database.list_agents("actor-tests")?.remove(0);
                agent.model = Some(AgentModelSnapshot {
                    source_profile_id: global.model_profiles[0].id.clone(),
                    source_profile_revision: global.model_profiles[0].revision.clone(),
                    profile: global.model_profiles[0].input(),
                });
                Ok(database
                    .save_agent(AgentSaveRequest {
                        data_generation_id: "actor-tests".into(),
                        client_request_id: Uuid::now_v7().to_string(),
                        expected_revision: Some(agent.revision.clone()),
                        configuration: agent,
                    })?
                    .0)
            })
            .await
            .unwrap();
        (directory, worker, agent, receiver)
    }

    fn unavailable<T>() -> AppResult<T> {
        Err(AppError::new(
            ErrorCode::CapabilityUnsupported,
            "测试不访问模型或系统凭据。",
        ))
    }

    fn initialized() -> Opportunity {
        Opportunity {
            chain_id: "initial-chain".into(),
            reason: "initialized",
            message_seq: 0.into(),
            mention_seq: 0.into(),
        }
    }

    fn actor(agent: &AgentConfiguration) -> (Actor, watch::Receiver<Opportunity>) {
        let (opportunities, receiver) = watch::channel(initialized());
        (
            Actor {
                revision: agent.revision.clone(),
                content_epoch: 0.into(),
                credential_ref: None,
                cancellation: CancellationToken::new(),
                opportunities,
            },
            receiver,
        )
    }

    #[test]
    fn model_search_round_returns_results_once_and_counts_both_model_calls() {
        use std::{io::{Read, Write}, net::TcpListener, thread};
        tauri::async_runtime::block_on(async {
            let (_directory, worker, _agent, _events) = fixture().await;
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            listener.set_nonblocking(true).unwrap();
            let endpoint = format!("http://{}/v1", listener.local_addr().unwrap());
            let (requests, received) = std::sync::mpsc::channel();
            let server = thread::spawn(move || {
                let deadline = std::time::Instant::now() + Duration::from_secs(20);
                for query in ["月球探测 最新进展", "不应执行的第二次查询"] {
                    let mut socket = loop {
                        if let Ok((socket, _)) = listener.accept() { break socket; }
                        if std::time::Instant::now() >= deadline { return; }
                        thread::sleep(Duration::from_millis(5));
                    };
                    // listener 是非阻塞的，accept 出来的连接在 Windows 上会继承这个标记，
                    // 直接 read 会偶发 WouldBlock；这里显式改回阻塞读。
                    socket.set_nonblocking(false).unwrap();
                    socket.set_read_timeout(Some(Duration::from_secs(5))).unwrap();
                    let mut bytes = Vec::new();
                    let (start, length) = loop {
                        let mut buffer = [0; 4096];
                        let count = socket.read(&mut buffer).unwrap();
                        assert!(count > 0);
                        bytes.extend_from_slice(&buffer[..count]);
                        if let Some(end) = bytes.windows(4).position(|part| part == b"\r\n\r\n") {
                            let header = String::from_utf8_lossy(&bytes[..end]);
                            let length: usize = header.lines().find_map(|line| {
                                let (name, value) = line.split_once(':')?;
                                name.eq_ignore_ascii_case("content-length").then(|| value.trim().parse().unwrap())
                            }).unwrap();
                            if bytes.len() >= end + 4 + length { break (end + 4, length); }
                        }
                    };
                    requests.send(serde_json::from_slice::<serde_json::Value>(&bytes[start..start + length]).unwrap()).unwrap();
                    let content = serde_json::json!({"participation":"observe","news_search":{"query":query}}).to_string();
                    let body = serde_json::json!({"id":"local-fixture","object":"chat.completion","model":"fixture","choices":[{"index":0,"message":{"role":"assistant","content":content},"finish_reason":"stop"}]}).to_string();
                    let response = format!("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
                    socket.write_all(response.as_bytes()).unwrap();
                }
            });
            let secrets = Arc::new(SecretStore::new(format!("news-runtime-test-{}", Uuid::now_v7())).unwrap());
            let key = secrets.create("local-fixture-key", &endpoint, &ModelProtocol::OpenaiChatCompletions).unwrap();
            let reference = key.clone();
            let agent = worker.call(move |database| {
                let mut global = database.get_global_configuration("actor-tests")?;
                global.model_profiles[0].base_url = endpoint;
                let global = database.save_global_configuration(GlobalConfigurationSaveRequest {
                    data_generation_id:"actor-tests".into(), client_request_id:Uuid::now_v7().to_string(), expected_revision:global.revision,
                    model_profiles:global.model_profiles.iter().map(ModelProfile::input).collect(), persona_presets:global.persona_presets,
                })?.0;
                let profile = &global.model_profiles[0];
                database.replace_credential_reference(&profile.id, &profile.revision, Some(reference))?;
                let (profile, _) = database.get_model_profile_internal(&profile.id)?;
                let mut agent = database.list_agents("actor-tests")?.remove(0);
                agent.model = Some(AgentModelSnapshot { source_profile_id:profile.id.clone(), source_profile_revision:profile.revision.clone(), profile:profile.input() });
                let agent = database.save_agent(AgentSaveRequest { data_generation_id:"actor-tests".into(), client_request_id:Uuid::now_v7().to_string(), expected_revision:Some(agent.revision.clone()), configuration:agent })?.0;
                let news = database.get_news_configuration("actor-tests")?;
                database.save_news_configuration(NewsConfigurationSaveRequest { data_generation_id:"actor-tests".into(), client_request_id:Uuid::now_v7().to_string(), expected_revision:news.revision, configuration:NewsConfiguration { proxy_enabled:true, proxy_mode:NewsProxyMode::Manual, proxy_url:String::new(), ..news.configuration } })?;
                Ok(agent)
            }).await.unwrap();
            let models = Ok(Arc::new(ModelGateway::new().unwrap()));
            let opportunity = Opportunity { reason:"planned_wake", ..initialized() };
            let mut count = 0;
            let result = make_decision(&agent, &worker, &models, &Ok(secrets.clone()), &opportunity, &0.into(), &CancellationToken::new(), &mut count).await;
            secrets.delete(&key).unwrap();
            let result = result.unwrap();
            assert_eq!(count, 2);
            assert!(result.decision.news_search.is_none());
            assert_eq!(result.decision.participation, Participation::Observe);
            let first = received.recv_timeout(Duration::from_secs(2)).unwrap();
            let second = received.recv_timeout(Duration::from_secs(2)).unwrap();
            let prompt = |body: serde_json::Value| serde_json::from_str::<serde_json::Value>(body["messages"][1]["content"].as_str().unwrap()).unwrap();
            assert_eq!(prompt(first)["news_search_available"], true);
            let second = prompt(second);
            assert_eq!(second["news_search_available"], false);
            assert_eq!(second["news_search_result"]["query"], "月球探测 最新进展");
            assert!(second["news_search_result"]["result"]["diagnostics"][0]["message"].as_str().unwrap().contains("手动代理模式需要"));
            server.join().unwrap();
            worker.shutdown().await.unwrap();
        });
    }

    #[test]
    fn cold_rooms_slow_down_instead_of_forcing_more_idle_requests() {
        let mut clock = IdleClock::new();
        clock.observe(0);
        let previous = clock.target_ms();
        clock.observe(30 * 60_000);
        assert!(clock.target_ms() > previous);
        assert_eq!(idle_trigger_chance(0), 50);
        assert_eq!(idle_trigger_chance(100), 95);
        for seed in [0, 1, 123456, u64::MAX] {
            assert!((800..3000).contains(&reading_delay_ms(true, seed)));
            assert!((1500..8500).contains(&reading_delay_ms(false, seed)));
        }
        assert_ne!(random_seed(), random_seed());
    }

    #[test]
    fn model_reported_fatigue_limits_messages_but_keeps_direct_replies() {
        fn speak(fatigue: u8) -> crate::runtime::decision::Decision {
            serde_json::from_value(serde_json::json!({
                "participation":"speak","topic_fatigue":fatigue,
                "messages":[{"parts":[{"kind":"text","text":"第一句"}]},{"parts":[{"kind":"text","text":"第二句"}]}]
            })).unwrap()
        }
        // 高疲劳只留一条换话题的话，不再整体沉默——否则模型误报疲劳就直接冷场。
        let mut decision = speak(90);
        apply_topic_fatigue(&mut decision, false);
        assert_eq!(decision.participation, Participation::Speak);
        assert_eq!(decision.messages.len(), 1);

        let mut decision = speak(90);
        apply_topic_fatigue(&mut decision, true);
        assert_eq!(decision.participation, Participation::Speak);
        assert_eq!(decision.messages.len(), 1);

        let mut decision = speak(70);
        apply_topic_fatigue(&mut decision, false);
        assert_eq!(decision.messages.len(), 1);

        let mut decision = speak(10);
        apply_topic_fatigue(&mut decision, false);
        assert_eq!(decision.messages.len(), 2);
    }

    #[test]
    fn observation_conflicts_never_protect_or_stop_a_live_actor() {
        tauri::async_runtime::block_on(async {
            let (_directory, worker, agent, _events) = fixture().await;
            let shutdown = CancellationToken::new();
            let (existing, _receiver) = actor(&agent);
            let token = existing.cancellation.clone();
            let mut actors = HashMap::from([(agent.agent_id.clone(), existing)]);
            for _ in 0..3 {
                report_failure(&worker, &agent,
                    AppError::new(ErrorCode::ConfigConflict, "有新的外部消息，旧候选已丢弃。"),
                    0, &token,
                ).await;
            }
            assert_eq!(worker.runtime_states().await.unwrap().into_iter()
                .find(|s| s.agent_id == agent.agent_id).unwrap().status, AgentRuntimeStatus::Observing);
            reconcile(&worker, &unavailable(), &unavailable(), &shutdown, &mut actors,
                None, ReconcileTrigger::NewMessage,
            ).await.unwrap();
            assert!(!token.is_cancelled());
            assert!(!actors[&agent.agent_id].opportunities.is_closed());
            shutdown.cancel();
            worker.shutdown().await.unwrap();
        });
    }

    #[test]
    fn initialization_does_not_reanswer_history_or_charge_a_model_request() {
        tauri::async_runtime::block_on(async {
            let (_directory, worker, agent, _events) = fixture().await;
            worker.call(|db| db.send_message(ChatSendRequest {
                data_generation_id: "actor-tests".into(),
                client_request_id: Uuid::now_v7().to_string(),
                parts: vec![MessagePart::Text { text: "过去聊过的事。".into() }],
                quote_message_id: None, mention_ids: vec![], mention_all: false,
            })).await.unwrap();
            let mut count = 0;
            let completed = make_decision(&agent, &worker, &unavailable(), &unavailable(),
                &initialized(), &0.into(), &CancellationToken::new(), &mut count,
            ).await.unwrap();
            assert_eq!(completed.decision.participation, Participation::Observe);
            assert_eq!(count, 0);
            assert_eq!(completed.observed_through_seq, 1.into());
            worker.shutdown().await.unwrap();
        });
    }

    #[test]
    fn content_epoch_reconciliation_cancels_cached_actor_even_when_configuration_is_unchanged() {
        tauri::async_runtime::block_on(async {
            let (_directory, worker, agent, _events) = fixture().await;
            let shutdown = CancellationToken::new();
            let (existing, _receiver) = actor(&agent);
            let old_token = existing.cancellation.clone();
            let mut actors = HashMap::from([(agent.agent_id.clone(), existing)]);
            worker
                .call(|database| {
                    database
                        .conn
                        .execute("UPDATE room SET content_epoch=1 WHERE singleton=1", [])?;
                    Ok(())
                })
                .await
                .unwrap();
            reconcile(
                &worker,
                &Err(AppError::new(ErrorCode::InternalError, "fixture")),
                &Err(AppError::new(ErrorCode::InternalError, "fixture")),
                &shutdown,
                &mut actors,
                None,
                ReconcileTrigger::Configuration,
            )
            .await
            .unwrap();
            assert!(old_token.is_cancelled());
            assert_eq!(actors[&agent.agent_id].content_epoch, 1.into());
            assert!(!actors[&agent.agent_id].cancellation.is_cancelled());
            shutdown.cancel();
            worker.shutdown().await.unwrap();
        });
    }

    #[test]
    fn live_unchanged_actor_is_not_restarted_for_fresh_messages() {
        tauri::async_runtime::block_on(async {
            let (_directory, worker, agent, _events) = fixture().await;
            let shutdown = CancellationToken::new();
            let (existing, _receiver) = actor(&agent);
            let cancellation = existing.cancellation.clone();
            let mut actors = HashMap::from([(agent.agent_id.clone(), existing)]);
            reconcile(
                &worker,
                &unavailable(),
                &unavailable(),
                &shutdown,
                &mut actors,
                None,
                ReconcileTrigger::NewMessage,
            )
            .await
            .unwrap();
            assert!(!cancellation.is_cancelled());
            assert!(!actors[&agent.agent_id].opportunities.is_closed());
            shutdown.cancel();
        });
    }

    #[test]
    fn finished_actor_recovers_on_fresh_message_without_a_synthetic_decision() {
        tauri::async_runtime::block_on(async {
            let (_directory, worker, agent, mut events) = fixture().await;
            let shutdown = CancellationToken::new();
            let (existing, receiver) = actor(&agent);
            let previous = existing.cancellation.clone();
            drop(receiver);
            let mut actors = HashMap::from([(agent.agent_id.clone(), existing)]);
            reconcile(
                &worker,
                &unavailable(),
                &unavailable(),
                &shutdown,
                &mut actors,
                None,
                ReconcileTrigger::NewMessage,
            )
            .await
            .unwrap();
            assert!(previous.is_cancelled());
            let recovered = &actors[&agent.agent_id];
            assert!(!recovered.opportunities.is_closed());
            let event = tokio::time::timeout(Duration::from_secs(2), events.recv())
                .await
                .unwrap()
                .unwrap();
            match event.payload {
                EventPayload::ParticipantProfileChanged { participant } => {
                    assert_eq!(
                        participant.runtime.unwrap().status,
                        AgentRuntimeStatus::Observing
                    );
                }
                _ => panic!("unexpected event"),
            }
            let latest = worker
                .runtime_states()
                .await
                .unwrap()
                .into_iter()
                .find(|state| state.agent_id == agent.agent_id)
                .unwrap();
            assert_eq!(latest.status, AgentRuntimeStatus::Observing);
            recovered.opportunities.send_replace(Opportunity {
                chain_id: "fresh-message-chain".into(),
                reason: "new_message",
                message_seq: 1.into(),
                mention_seq: 1.into(),
            });
            tokio::time::timeout(Duration::from_secs(5), recovered.opportunities.closed())
                .await
                .unwrap();
            let latest = worker
                .runtime_states()
                .await
                .unwrap()
                .into_iter()
                .find(|state| state.agent_id == agent.agent_id)
                .unwrap();
            assert_eq!(latest.status, AgentRuntimeStatus::NeedsConfiguration);
            assert_eq!(latest.requests_today, 0);
            shutdown.cancel();
        });
    }

    #[test]
    fn recovered_actor_consumes_fresh_opportunity_queued_before_startup() {
        tauri::async_runtime::block_on(async {
            let (_directory, worker, agent, _events) = fixture().await;
            let cancellation = CancellationToken::new();
            let (opportunities, receiver) = watch::channel(initialized());
            opportunities.send_replace(Opportunity {
                chain_id: "queued-fresh-message".into(),
                reason: "new_message",
                message_seq: 1.into(),
                mention_seq: 1.into(),
            });
            tokio::time::timeout(
                Duration::from_secs(5),
                run_actor(
                    agent.clone(),
                    worker.clone(),
                    (unavailable(), unavailable()),
                    receiver,
                    cancellation,
                    true,
                    true,
                ),
            )
            .await
            .unwrap();
            assert!(opportunities.is_closed());
            let latest = worker
                .runtime_states()
                .await
                .unwrap()
                .into_iter()
                .find(|state| state.agent_id == agent.agent_id)
                .unwrap();
            assert_eq!(latest.status, AgentRuntimeStatus::NeedsConfiguration);
            assert_eq!(latest.requests_today, 0);
        });
    }

    #[test]
    fn fresh_messages_do_not_revive_paused_or_same_revision_protected_actors() {
        tauri::async_runtime::block_on(async {
            for status in [AgentRuntimeStatus::Paused, AgentRuntimeStatus::Protected] {
                let (_directory, worker, agent, _events) = fixture().await;
                if status == AgentRuntimeStatus::Paused {
                    worker
                        .set_runtime_paused(agent.agent_id.clone(), true)
                        .await
                        .unwrap();
                } else {
                    worker
                        .set_runtime_state(AgentRuntimeState {
                            agent_id: agent.agent_id.clone(),
                            config_revision: agent.revision.clone(),
                            status,
                            detail: None,
                            next_wake_at: None,
                            requests_today: 0,
                        })
                        .await
                        .unwrap();
                }
                let shutdown = CancellationToken::new();
                let (existing, receiver) = actor(&agent);
                let previous = existing.cancellation.clone();
                drop(receiver);
                let mut actors = HashMap::from([(agent.agent_id.clone(), existing)]);
                reconcile(
                    &worker,
                    &unavailable(),
                    &unavailable(),
                    &shutdown,
                    &mut actors,
                    None,
                    ReconcileTrigger::NewMessage,
                )
                .await
                .unwrap();
                assert!(previous.is_cancelled());
                assert!(!actors.contains_key(&agent.agent_id));
                shutdown.cancel();
            }
        });
    }
}
