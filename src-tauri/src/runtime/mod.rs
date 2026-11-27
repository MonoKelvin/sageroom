mod decision;
pub(crate) mod local_tools;
mod mcp_tools;
mod peers;
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
    storage::{runtime::{RuntimeExperience, RuntimeMessage, tool_decision_id}, worker::DbWorker},
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
    Refine,
}


const ROOM_IDLE_SPACING: Duration = Duration::from_secs(75);
static IDLE_SLOT: tokio::sync::Mutex<Option<tokio::time::Instant>> = tokio::sync::Mutex::const_new(None);

fn idle_interval(activity: u8, seed: u64, sleeping: bool) -> Duration {
    let seconds = 110 - u64::from(activity.min(100)) / 3 + seed % 21;
    Duration::from_secs(if sleeping { seconds * 3 } else { seconds })
}

fn claim_idle_slot(
    slot: &tokio::sync::Mutex<Option<tokio::time::Instant>>,
    now: tokio::time::Instant,
    seed: u64,
) -> Result<tokio::sync::MutexGuard<'_, Option<tokio::time::Instant>>, tokio::time::Instant> {
    let mut slot = slot.try_lock().map_err(|_| now + Duration::from_secs(12 + seed % 9))?;
    if let Some(ready) = *slot {
        if ready > now {
            return Err(ready + Duration::from_secs(seed % 6));
        }
    }
    *slot = Some(now + ROOM_IDLE_SPACING);
    Ok(slot)
}

fn random_seed() -> u64 {
    Uuid::now_v7().as_u128() as u64
}

fn reading_delay_ms(addressed: bool, seed: u64) -> u64 {
    if addressed { 800 + seed % 2200 } else { 1500 + seed % 7000 }
}

struct Actor {
    tool: bool,
    revision: DecimalString,
    content_epoch: DecimalString,
    credential_ref: Option<String>,
    cancellation: CancellationToken,
    opportunities: watch::Sender<Opportunity>,
}

impl Actor {
    fn notify_tool(&self, through: &DecimalString, direct: bool) {
        self.opportunities.send_modify(|signal| {
            if direct && sequence(&signal.mention_seq) == 0 {
                signal.message_seq = sequence(&signal.message_seq).min(sequence(through) - 1).into();
            }
            signal.mention_seq = sequence(&signal.mention_seq).max(sequence(through)).into();
        });
    }
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
                                if actor.tool {
                                    if id != &sender_id && !mentions.1 && mentions.0.contains(id) {
                                        actor.notify_tool(&message_seq, true);
                                    }
                                    continue;
                                }
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
                                if actor.tool {
                                    actor.notify_tool(&snapshot.latest_message_seq, false);
                                    continue;
                                }
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
        let credential_ref = if force || !actors.get(&agent.agent_id).is_some_and(|actor| {
            actor.revision == agent.revision && actor.credential_ref.is_some()
        }) {
            let id = agent.agent_id.clone();
            worker.call(move |database| database.runtime_credential_reference(&id)).await?
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
        let prior_tool_signal = actors.remove(&agent.agent_id).and_then(|old| {
            old.cancellation.cancel();
            (old.tool && agent.agent_type == AgentType::Tool && old.revision == agent.revision
                && restart != Some(agent.agent_id.as_str())).then(|| old.opportunities.borrow().clone())
        });
        let tool = agent.agent_type == AgentType::Tool;
        if credential_ref.is_none() {
            let _ = worker
                .set_runtime_state(AgentRuntimeState {
                    agent_id: agent.agent_id,
                    config_revision: agent.revision,
                    status: AgentRuntimeStatus::NeedsConfiguration,
                    detail: None,
                    next_wake_at: None,
                    requests_today: 0,
                })
                .await;
            continue;
        }
        if !tool && actors
            .values()
            .filter(|a| !a.tool && !a.opportunities.is_closed())
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
        let opportunity = prior_tool_signal.unwrap_or_else(|| Opportunity {
            chain_id: Uuid::now_v7().to_string(),
            reason: "initialized",
            message_seq: if tool { snapshot.latest_message_seq.clone() } else { 0.into() },
            mention_seq: 0.into(),
        });
        let (opportunities, receiver) = watch::channel(opportunity);
        actors.insert(
            agent.agent_id.clone(),
            Actor {
                tool,
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
            if tool {
                run_tool_actor(agent, worker, (models, secrets), receiver, cancellation).await;
                return;
            }
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

async fn run_tool_actor(
    agent: AgentConfiguration,
    worker: Arc<DbWorker>,
    services: (AppResult<Arc<ModelGateway>>, AppResult<Arc<SecretStore>>),
    mut opportunities: watch::Receiver<Opportunity>,
    cancellation: CancellationToken,
) {
    let (models, secrets) = services;
    let mut count = 0;
    if state(&worker, &agent, AgentRuntimeStatus::Observing, None, None, count, &cancellation).await.is_err() {
        return;
    }
    let mut cursor = None;
    loop {
        if cancellation.is_cancelled() {
            return;
        }
        let signal = opportunities.borrow_and_update().clone();
        let through = sequence(&signal.mention_seq);
        if through != 0 {
            let after = *cursor.get_or_insert_with(|| sequence(&signal.message_seq));
            let id = agent.agent_id.clone();
            let next = worker.call(move |database| database.next_tool_request(&id, after, through)).await;
            match next {
                Ok(Some(seq)) => {
                    cursor = Some(sequence(&seq));
                    let chain_id = worker.runtime_chain(seq.clone()).await.unwrap_or_else(|_| Uuid::now_v7().to_string());
                    let task = Opportunity { chain_id, reason: "tool_request", message_seq: seq.clone(), mention_seq: seq };
                    match make_decision(&agent, &worker, &models, &secrets, &task, &0.into(), &cancellation, &mut count).await {
                        Ok(_) => {
                            if state(&worker, &agent, AgentRuntimeStatus::Observing, None, None, count, &cancellation).await.is_err() {
                                return;
                            }
                        }
                        Err(error) => report_failure(&worker, &agent, error, count, &cancellation).await,
                    }
                    continue;
                }
                Ok(None) => cursor = Some(after.max(through)),
                Err(error) => {
                    report_failure(&worker, &agent, error, count, &cancellation).await;
                    return;
                }
            }
        }
        tokio::select! {
            biased;
            _ = cancellation.cancelled() => return,
            result = opportunities.changed() => if result.is_err() { return; },
        }
    }
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
    let activity = agent.dimensions.activity;
    let mut idle_at = tokio::time::Instant::now() + idle_interval(activity, random_seed(), sleeping);
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
                    idle_at = tokio::time::Instant::now() + idle_interval(activity, random_seed(), sleeping);
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
                            let _=state(&worker,&agent,AgentRuntimeStatus::Sleeping,Some("自主检查已达到两次/滚动小时，将按既有计划稍后继续。".into()),Some(at),count,&cancellation).await;
                            continue;
                        },
                        Ok(None)=>Some(Opportunity{chain_id:chain,reason:"planned_wake",message_seq:observed_through_seq.clone(),mention_seq:0.into()}),
                        Err(error)=>{report_failure(&worker,&agent,error,count,&cancellation).await;break;}
                    }
                }
                _=tokio::time::sleep_until(idle_at), if next.is_none()=>{
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
        let idle_slot = if current.reason == "idle_tick" {
            let now = tokio::time::Instant::now();
            match claim_idle_slot(&IDLE_SLOT, now, random_seed()) {
                Ok(slot) => Some(slot),
                Err(ready) => {
                    idle_at = ready;
                    continue;
                }
            }
        } else {
            None
        };
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
        drop(idle_slot);
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
                idle_at = tokio::time::Instant::now() + idle_interval(activity, random_seed(), sleeping);
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
        idle_at = tokio::time::Instant::now() + idle_interval(activity, random_seed(), sleeping);
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
    let task_seq = (opportunity.reason == "tool_request").then(|| opportunity.message_seq.clone());
    let id = agent.agent_id.clone();
    let origin = task_seq.clone();
    let mut input = worker.call(move |database| database.runtime_input_for(&id, origin)).await?;
    if input.agent.revision != agent.revision || (input.agent.agent_type == AgentType::Tool) != task_seq.is_some() {
        return Err(AppError::new(ErrorCode::ConfigConflict, "成员配置已改变。"));
    }
    let idle = opportunity.reason == "idle_tick";
    let task = task_seq.is_some();
    let addressed = !idle && (sequence(&opportunity.mention_seq) > sequence(observed_through_seq)
        || decision::addressed_since(&input, observed_through_seq));
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
    let policy = (!task).then(|| style::for_input(&input, opportunity.reason, addressed));
    let agents = if task {
        Vec::new()
    } else {
        worker.list_agents(AgentListRequest { data_generation_id: input.snapshot.data_generation_id.clone() }).await?
    };
    let candidates = if matches!(opportunity.reason, "new_message" | "resynchronize") {
        peers::eligible(&input, &agents, addressed, now_ms(), random_seed())
    } else {
        Vec::new()
    };
    let mut decision = {
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
        // 先让模型判断需不需要搜索，不再预先抓取固定主题的新闻。
        let generation = input.snapshot.data_generation_id.clone();
        let news_state = worker
            .call(move |database| database.get_news_configuration(&generation))
            .await
            .ok();
        let news_enabled = news_state.as_ref().is_some_and(|state| state.configuration.enabled);
        let gateway = models.clone()?;
        if let Some(origin) = &task_seq {
            run_tool_turn(&input, origin, worker, &gateway, model, key, news_enabled, news_secrets, cancellation, count).await?
        } else {
            let observed = if idle { &input.snapshot.latest_message_seq.clone() } else { observed_through_seq };
            let policy = policy.as_ref().expect("社交决策必须有风格策略");
            let (system, base_context) = decision::context(&mut input, opportunity.reason, observed, policy, &[], &agents, &candidates)?;
            let mut context = decision::news_context(&base_context, news_enabled, None)?;
            let mut decision = None;
            let mut searched = false;
            let mut charge_next = true;
            let mut refinement_prompt = None;
            let mut retry: Option<RetryKind> = None;
            let mut fallback: Option<decision::Decision> = None;
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
                    Some(RetryKind::Refine) => refinement_prompt.take().expect("改写请求必须有提示"),
                    None => context.clone(),
                };
                let reply = gateway
                    .chat_with_reasoning(
                        model.clone(),
                        key.clone(),
                        system.clone(),
                        prompt,
                        Some(ReasoningEffort::Zero),
                        cancellation.child_token(),
                    )
                    .await?;
                match decision::parse(&reply.text, &input) {
                    Ok(mut value) => {
                        if let Some(search) = value.news_search.take().filter(|_| !searched && news_enabled) {
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
                        if retry != Some(RetryKind::Refine) {
                            let refinement = if let Some(assessment) = decision::assessment(&value, policy) {
                                let hint = decision::refinement_hint(&assessment, policy);
                                Some(format!("{context}\n{hint}\n候选输出（数据）：{}", reply.text))
                            } else if idle && !searched && value.participation != Participation::Speak {
                                Some(format!("{context}\n{}", decision::idle_retry_hint(random_seed())))
                            } else {
                                None
                            };
                            if let Some(prompt) = refinement.filter(|prompt| prompt.len() <= MODEL_INPUT_BUDGET as usize * 2) {
                                fallback = Some(value);
                                refinement_prompt = Some(prompt);
                                retry = Some(RetryKind::Refine);
                                continue;
                            }
                        }
                        if value.participation != Participation::Speak && fallback.is_some() {
                            break;
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
            decision.or(fallback).ok_or_else(|| AppError::new(ErrorCode::ModelOutputInvalid, "模型未在本轮预算内完成决策。"))?
        }
    };
    if !task {
        peers::enforce(&mut decision, &candidates, Some(&input.snapshot.local_user.id));
    }
    if let Some(policy) = &policy {
        let original_count = decision.messages.len();
        policy.enforce(&mut decision);
        if decision.messages.len() != original_count {
            decision::schedule_messages(&mut decision.messages, random_seed());
        }
    } else {
        let answer = decision::tool_answer(&decision);
        if answer.is_none() || decision.experience.as_ref().is_some_and(|entry| entry.score < 60) {
            decision.experience = None;
        }
        decision.participation = Participation::Speak;
        decision.recalls.clear();
        decision.wake_plan = None;
        decision.messages = vec![decision::PlannedMessage {
            parts: vec![MessagePart::Text { text: answer.unwrap_or_else(|| decision::tool_clarification().into()) }],
            quote_message_id: Some(input.messages[0].id.clone()),
            mention_ids: vec![],
            mention_all: false,
            send_after_ms: 0,
        }];
    }
    if idle {
        if decision.participation != Participation::Speak {
            decision.participation = Participation::Observe;
        }
        decision.wake_plan = None;
        decision.experience = None;
    }
    if cancellation.is_cancelled() {
        return Err(AppError::new(ErrorCode::ShuttingDown, "成员请求已取消。"));
    }
    let observed = task_seq.as_ref().unwrap_or(&input.snapshot.latest_message_seq).clone();
    let id = agent.agent_id.clone();
    let origin = task_seq.clone();
    let latest = worker.call(move |database| database.runtime_input_for(&id, origin)).await?;
    if latest.agent.revision != agent.revision
        || (!task && latest.snapshot.latest_message_seq != input.snapshot.latest_message_seq)
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
    let decision_id = (!decision.messages.is_empty()).then(|| {
        if task { tool_decision_id(&agent.agent_id, &observed) } else { Uuid::now_v7().to_string() }
    });
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
                    observed_through_seq: observed.clone(),
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
            observed_through_seq: observed.clone(),
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

async fn run_tool_turn(
    input: &crate::storage::runtime::RuntimeInput,
    origin: &DecimalString,
    worker: &DbWorker,
    gateway: &ModelGateway,
    model: ModelProfile,
    key: String,
    news_enabled: bool,
    secrets: Arc<SecretStore>,
    cancellation: &CancellationToken,
    count: &mut u32,
) -> AppResult<decision::Decision> {
    use serde_json::{Value, json};

    let (system, base) = decision::tool_context(input)?;
    let agent = &input.agent;
    let catalog = if agent.local_tools_enabled == Some(true)
        && input.messages[0].sender_id == input.snapshot.local_user.id
    {
        mcp_tools::load(std::path::Path::new(&input.snapshot.data_directory), &agent.agent_id).ok().flatten()
    } else { None };
    let mut feedback = Vec::new();
    let mut searched: Option<(String, NewsPreviewResponse)> = None;
    let mut local_used = false;
    let mut repair = false;
    let mut receipt = None;
    for attempt in 0..5 {
        let remaining = if attempt == 4 { 0 } else { 2_usize.saturating_sub(feedback.len() + usize::from(searched.is_some())) };
        let mut context: Value = serde_json::from_str(&base)?;
        context["tool_results"] = json!(feedback);
        context["remaining_tool_steps"] = json!(remaining);
        context["local_tools"] = decision::local_tool_context(input, local_used, remaining);
        context["mcp_tools"] = if !local_used && remaining > 0 {
            json!(catalog.as_ref().map(|catalog| catalog.tools.as_slice()).unwrap_or_default())
        } else { json!([]) };
        let mut prompt = decision::news_context(
            &context.to_string(), news_enabled && searched.is_none() && remaining > 0,
            searched.as_ref().map(|(query, result)| (query.as_str(), result)),
        )?;
        if repair {
            let hint = decision::tool_retry_hint();
            if prompt.len() + hint.len() + 1 <= MODEL_INPUT_BUDGET as usize * 2 {
                prompt.push('\n');
                prompt.push_str(hint);
            }
        }
        *count = match worker.reserve_runtime_request(agent.agent_id.clone(), DAILY_REQUEST_LIMIT).await {
            Ok(reserved) => reserved,
            Err(error) if error.code == ErrorCode::Backpressure && receipt.is_some() => break,
            Err(error) => return Err(error),
        };
        state(worker, agent, AgentRuntimeStatus::Deciding, None, None, *count, cancellation).await?;
        let reply = match gateway.chat_with_reasoning(model.clone(), key.clone(), system.clone(), prompt, None, cancellation.child_token()).await {
            Ok(reply) => reply,
            Err(error) if receipt.is_none() || cancellation.is_cancelled() => return Err(error),
            Err(_) => break,
        };
        let Ok(mut output) = decision::parse(&reply.text, input) else {
            if repair { break; }
            repair = true;
            continue;
        };
        if decision::tool_answer(&output).is_some() {
            return Ok(output);
        }
        if remaining > 0 {
            let (operation, result) = if let Some(action) = output.local_action.take() {
                let name = action.operation();
                let result = if local_used {
                    Err("本轮已经尝试过一次本地操作，请根据实际结果回答。".into())
                } else {
                    local_used = true;
                    match run_local_action(action, input, origin, worker, cancellation).await {
                        Ok(text) => { receipt = Some(text.clone()); Ok(text) }
                        Err(error) if matches!(error.code, ErrorCode::ShuttingDown | ErrorCode::ConfigConflict) => return Err(error),
                        Err(error) => { receipt = Some(error.message.clone()); Err(error.message) }
                    }
                };
                (name, result)
            } else if let Some(call) = output.mcp_tool.take() {
                let result = if local_used {
                    Err("本轮已经尝试过一次本地操作，请根据实际结果回答。".into())
                } else if let Some(catalog) = &catalog {
                    local_used = true;
                    let id = agent.agent_id.clone();
                    let revision = agent.revision.clone();
                    let epoch = input.snapshot.room.content_epoch.clone();
                    let origin = origin.clone();
                    let token = cancellation.clone();
                    let current = worker.call(move |database| {
                        let root = authorized_local_root(database, &id, origin, &revision, &epoch, &token)?;
                        Ok(mcp_tools::load(&root, &id).ok().flatten())
                    }).await?;
                    if current.as_ref() != Some(catalog) {
                        Err("本机 MCP 工具目录已变化，请重新发起委托。".into())
                    } else {
                        tokio::select! {
                            biased;
                            _ = cancellation.cancelled() => return Err(AppError::new(ErrorCode::ShuttingDown, "本机 MCP 请求已取消。")),
                            result = catalog.call(&call) => result.map_err(str::to_owned),
                        }
                    }
                } else {
                    Err("本轮没有已授权的本机 MCP 工具。".into())
                };
                ("mcp_tool", result)
            } else if let Some(search) = output.news_search.take() {
                let query = search.query.trim();
                if searched.is_some() || !news_enabled {
                    ("online_search", Err("本轮不能再次检索，或联网搜索未启用。".into()))
                } else if !decision::public_search_query(query, input) {
                    ("online_search", Err("检索词须是公开主题，不得包含私有地址、账号、凭据或群员标识。".into()))
                } else {
                    let generation = input.snapshot.data_generation_id.clone();
                    let configuration = worker.call(move |database| database.get_news_configuration(&generation)).await?;
                    let result = tokio::select! {
                        biased;
                        _ = cancellation.cancelled() => return Err(AppError::new(ErrorCode::ShuttingDown, "联网检索已取消。")),
                        result = crate::news::search_for_task(&configuration.configuration, query, Some(secrets.clone())) => result,
                    };
                    searched = Some((query.to_owned(), result));
                    repair = false;
                    continue;
                }
            } else {
                if repair { break; }
                repair = true;
                continue;
            };
            let (ok, text) = match result { Ok(text) => (true, text), Err(text) => (false, text) };
            feedback.push(json!({"operation":operation,"ok":ok,"result":text.chars().take(750).collect::<String>()}));
            repair = false;
            continue;
        }
        if repair { break; }
        repair = true;
    }
    let fallback = receipt.map_or_else(
        || decision::tool_clarification().into(),
        |result| format!("{result}\n暂未得到对原委托的完整答复。"),
    );
    decision::host_answer(input, fallback)
}

async fn run_local_action(
    action: local_tools::LocalAction,
    input: &crate::storage::runtime::RuntimeInput,
    origin: &DecimalString,
    worker: &DbWorker,
    cancellation: &CancellationToken,
) -> AppResult<String> {
    if input.agent.local_tools_enabled != Some(true) {
        return Err(AppError::new(ErrorCode::PermissionDenied, "未开启本地工具，未执行操作。可在该助手的工具设置中授权。"));
    }
    let id = input.agent.agent_id.clone();
    let origin = origin.clone();
    let revision = input.agent.revision.clone();
    let epoch = input.snapshot.room.content_epoch.clone();
    let cancellation = cancellation.clone();
    worker.call(move |database| {
        let root = authorized_local_root(database, &id, origin, &revision, &epoch, &cancellation)?;
        action.execute(&root, &id, &cancellation).map_err(|_| AppError::new(
            ErrorCode::IoError, "本地操作未完成：名称、文件内容或工作区不符合要求，或系统拒绝访问。",
        ))
    }).await
}

fn authorized_local_root(
    database: &mut crate::storage::database::Database,
    id: &str,
    origin: DecimalString,
    revision: &DecimalString,
    epoch: &DecimalString,
    cancellation: &CancellationToken,
) -> AppResult<std::path::PathBuf> {
    let current = database.runtime_input_for(id, Some(origin))?;
    if &current.agent.revision != revision || &current.snapshot.room.content_epoch != epoch
        || current.agent.local_tools_enabled != Some(true) || current.messages[0].sender_id != current.snapshot.local_user.id
        || database.runtime_is_paused(id)? || cancellation.is_cancelled()
    {
        return Err(AppError::new(ErrorCode::ConfigConflict, "原委托已变化，未执行本地操作。"));
    }
    Ok(current.snapshot.data_directory.into())
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
                tool: agent.agent_type == AgentType::Tool,
                revision: agent.revision.clone(),
                content_epoch: 0.into(),
                credential_ref: None,
                cancellation: CancellationToken::new(),
                opportunities,
            },
            receiver,
        )
    }

    async fn model_fixture(
        worker: &DbWorker,
        replies: Vec<serde_json::Value>,
    ) -> (AgentConfiguration, Arc<SecretStore>, String, std::sync::mpsc::Receiver<serde_json::Value>, std::thread::JoinHandle<()>) {
        use std::{io::{Read, Write}, net::TcpListener, thread};
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        listener.set_nonblocking(true).unwrap();
        let endpoint = format!("http://{}/v1", listener.local_addr().unwrap());
        let (requests, received) = std::sync::mpsc::channel();
        let server = thread::spawn(move || {
            let deadline = std::time::Instant::now() + Duration::from_secs(20);
            for content in replies {
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
                let body = serde_json::json!({"id":"local-fixture","object":"chat.completion","model":"fixture","choices":[{"index":0,"message":{"role":"assistant","content":content.to_string()},"finish_reason":"stop"}]}).to_string();
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
            Ok(agent)
        }).await.unwrap();
        (agent, secrets, key, received, server)
    }

    #[test]
    fn model_search_round_returns_results_once_and_counts_both_model_calls() {
        tauri::async_runtime::block_on(async {
            let (_directory, worker, _agent, _events) = fixture().await;
            let replies = ["月球探测 最新进展", "不应执行的第二次查询"].into_iter().map(|query| {
                serde_json::json!({"participation":"observe","news_search":{"query":query}})
            }).collect();
            let (agent, secrets, key, received, server) = model_fixture(&worker, replies).await;
            worker.call(|database| {
                let news = database.get_news_configuration("actor-tests")?;
                database.save_news_configuration(NewsConfigurationSaveRequest { data_generation_id:"actor-tests".into(), client_request_id:Uuid::now_v7().to_string(), expected_revision:news.revision, configuration:NewsConfiguration { proxy_enabled:true, proxy_mode:NewsProxyMode::Manual, proxy_url:String::new(), ..news.configuration } })?;
                Ok(())
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
    fn local_tools_use_the_persisted_permission_and_stop_after_revocation() {
        tauri::async_runtime::block_on(async {
            let (directory, worker, mut agent, _events) = fixture().await;
            agent.agent_type = AgentType::Tool;
            agent.local_tools_enabled = Some(true);
            let save = |agent: AgentConfiguration| worker.call(move |database| {
                Ok(database.save_agent(AgentSaveRequest {
                    data_generation_id: "actor-tests".into(), client_request_id: Uuid::now_v7().to_string(),
                    expected_revision: Some(agent.revision.clone()), configuration: agent,
                })?.0)
            });
            let mut agent = save(agent).await.unwrap();
            let source = worker.send_message(ChatSendRequest {
                data_generation_id: "actor-tests".into(), client_request_id: Uuid::now_v7().to_string(),
                parts: vec![MessagePart::Text { text: "保存草稿。".into() }], quote_message_id: None,
                mention_ids: vec![agent.agent_id.clone()], mention_all: false,
            }).await.unwrap().message_seq;
            let id = agent.agent_id.clone();
            let seq = source.clone();
            let input = worker.call(move |database| database.runtime_input_for(&id, Some(seq))).await.unwrap();
            let write = |text: &str| local_tools::LocalAction::WriteText { name: "draft.txt".into(), text: text.into() };
            let cancellation = CancellationToken::new();
            assert!(run_local_action(write("第一版"), &input, &source, &worker, &cancellation).await.unwrap().contains("已创建"));
            let file = directory.path().join("agents").join(&agent.agent_id).join("workspace").join("draft.txt");
            agent.local_tools_enabled = Some(false);
            save(agent).await.unwrap();
            assert_eq!(run_local_action(write("不允许的旧操作"), &input, &source, &worker, &cancellation).await.unwrap_err().code, ErrorCode::ConfigConflict);
            assert_eq!(std::fs::read_to_string(file).unwrap(), "第一版");
            worker.shutdown().await.unwrap();
        });
    }

    #[test]
    fn tool_supervisor_processes_each_direct_mention_without_replaying_or_joining_chat() {
        use serde_json::{Value, json};
        tauri::async_runtime::block_on(async {
            let (directory, worker, _agent, mut events) = fixture().await;
            let answer = "先检查客户端的超时设置。\n\n若服务端已收到请求，再对照服务端日志定位慢查询，不要直接放宽全部接口的超时。";
            let answer_json = json!({"participation":"speak","messages":[{"parts":[{"kind":"text","text":answer}]}],
                "experience":{"content":"已确认慢查询排查顺序：客户端超时与服务端日志分开核对。","score":75}});
            let second_answer = "请提供操作系统版本和完整错误提示。";
            let mcp_answer = "本轮没有授权的本机工具。";
            let replies = vec![
                answer_json,
                json!({"participation":"observe"}),
                json!({"participation":"speak","messages":[{"parts":[{"kind":"text","text":second_answer}]}]}),
                json!({"participation":"observe","mcp_tool":{"name":"inventory","arguments":{}}}),
                json!({"participation":"speak","messages":[{"parts":[{"kind":"text","text":mcp_answer}]}]}),
                json!({"participation":"observe","local_action":{"operation":"write_text","name":"draft.txt","text":"不应写入"}}),
                json!({"participation":"speak","messages":[{"parts":[{"kind":"text","text":"未开启本地工具，草稿没有保存。"}]}]}),
            ];
            let (mut agent, secrets, key, received, server) = model_fixture(&worker, replies).await;
            agent.agent_type = AgentType::Tool;
            let agent = worker.call(move |database| Ok(database.save_agent(AgentSaveRequest {
                data_generation_id: "actor-tests".into(), client_request_id: Uuid::now_v7().to_string(),
                expected_revision: Some(agent.revision.clone()), configuration: agent,
            })?.0)).await.unwrap();
            let send = |text: &str, direct: bool, everyone: bool| worker.send_message(ChatSendRequest {
                data_generation_id: "actor-tests".into(), client_request_id: Uuid::now_v7().to_string(),
                parts: vec![MessagePart::Text { text: text.into() }], quote_message_id: None,
                mention_ids: if direct { vec![agent.agent_id.clone()] } else { vec![] }, mention_all: everyone,
            });
            send("这是启动之前的旧委托。", true, false).await.unwrap();
            while events.try_recv().is_ok() {}
            let supervisor = RuntimeSupervisor::new();
            supervisor.start(worker.clone(), Ok(Arc::new(ModelGateway::new().unwrap())), Ok(secrets.clone()));
            let publisher = supervisor.clone();
            let relay = tauri::async_runtime::spawn(async move {
                while let Some(event) = events.recv().await { publisher.publish(&event); }
            });
            tokio::time::timeout(Duration::from_secs(5), async {
                loop {
                    if worker.runtime_states().await.unwrap().iter().any(|state| {
                        state.agent_id == agent.agent_id && state.status == AgentRuntimeStatus::Observing
                    }) { break; }
                    tokio::time::sleep(Duration::from_millis(10)).await;
                }
            }).await.unwrap();
            send("这是不相关的群公告。", false, true).await.unwrap();
            let a = send("怎么排查接口请求超时？", true, false).await.unwrap();
            let b = send("电脑出问题了，帮我看看。", true, false).await.unwrap();
            send("这是两条委托之后的普通闲聊。", false, false).await.unwrap();
            let external = send("使用已配置的工具查询清单。", true, false).await.unwrap();
            let draft = send("请在工作区保存以上草稿。", true, false).await.unwrap();
            let page = tokio::time::timeout(Duration::from_secs(12), async {
                loop {
                    let page = worker.list_messages(ChatListRequest {
                        data_generation_id: "actor-tests".into(), before_seq: None, after_seq: None,
                        around_seq: None, limit: 20,
                    }).await.unwrap();
                    if page.items.iter().filter(|message| message.sender_id == agent.agent_id).count() == 4 {
                        break page;
                    }
                    tokio::time::sleep(Duration::from_millis(10)).await;
                }
            }).await;
            supervisor.shutdown();
            relay.abort();
            secrets.delete(&key).unwrap();
            let page = page.unwrap();
            let replies: Vec<_> = page.items.iter().filter(|message| message.sender_id == agent.agent_id).collect();
            assert_eq!(replies[0].quote_message_id.as_ref(), Some(&a.message_id));
            assert_eq!(replies[1].quote_message_id.as_ref(), Some(&b.message_id));
            assert_eq!(style::body(&replies[0].parts), answer);
            assert_eq!(style::body(&replies[1].parts), second_answer);
            assert_eq!(replies[2].quote_message_id.as_ref(), Some(&external.message_id));
            assert_eq!(style::body(&replies[2].parts), mcp_answer);
            assert_eq!(replies[3].quote_message_id.as_ref(), Some(&draft.message_id));
            assert!(style::body(&replies[3].parts).contains("未开启本地工具"));
            assert!(!directory.path().join("agents").join(&agent.agent_id).join("workspace").exists());
            server.join().unwrap();
            let requests: Vec<_> = received.try_iter().collect();
            assert_eq!(requests.len(), 7);
            assert!(requests[0].get("reasoning_effort").is_none());
            assert!(requests[0].get("temperature").is_none());
            let prompt = |request: &Value| request["messages"][1]["content"].as_str().unwrap().to_owned();
            let context = |index: usize| serde_json::from_str::<Value>(&prompt(&requests[index])).unwrap();
            let first = context(0);
            assert_eq!(first["request"]["text"], "怎么排查接口请求超时？");
            assert!(first.get("recent_messages").is_none());
            assert!(first.get("local_reference").is_none());
            assert_eq!(first["local_tools"]["enabled"], false);
            assert_eq!(first["local_tools"]["turn_state"], "disabled");
            assert!(requests[0]["messages"][0]["content"].as_str().unwrap().contains("Sageroom 工具助手约定"));
            assert!(prompt(&requests[2]).contains("请用合法 JSON 发出一条实际答复"));
            let external = context(3);
            assert_eq!(external["request"]["text"], "使用已配置的工具查询清单。");
            assert_eq!(external["mcp_tools"], json!([]));
            let rejected = context(4);
            assert_eq!(rejected["local_tools"]["enabled"], false);
            assert_eq!(rejected["tool_results"][0]["operation"], "mcp_tool");
            assert_eq!(rejected["tool_results"][0]["ok"], false);
            let denied = context(6);
            assert_eq!(denied["local_tools"]["turn_state"], "disabled");
            assert_eq!(denied["local_tools"]["allowed_operations"], json!([]));
            assert_eq!(denied["tool_results"][0]["operation"], "write_text");
            assert_eq!(denied["tool_results"][0]["ok"], false);
            assert!(denied["tool_results"][0]["result"].as_str().unwrap().contains("未开启本地工具"));
            let entries = worker.list_experience(ExperienceAgentRequest {
                data_generation_id: "actor-tests".into(), agent_id: agent.agent_id.clone(),
            }).await.unwrap();
            assert_eq!(entries.len(), 1);
            assert_eq!(entries[0].score, 75);
            let id = agent.agent_id.clone();
            let through = sequence(&b.message_seq);
            assert!(worker.call(move |database| database.next_tool_request(&id, sequence(&a.message_seq)-1, through)).await.unwrap().is_none());
            worker.shutdown().await.unwrap();
        });
    }

    #[test]
    fn tool_turn_preserves_permissions_and_returns_search_and_local_results() {
        use serde_json::{Value, json};
        tauri::async_runtime::block_on(async {
            let (directory, worker, _agent, _events) = fixture().await;
            let speak = |text: &str| json!({"participation":"speak","messages":[{"parts":[{"kind":"text","text":text}]}]});
            let write = json!({"participation":"observe","local_action":{"operation":"write_text","name":"denied.txt","text":"不应写入"}});
            let replies = vec![
                speak("DNS 将域名解析成 IP 地址，让客户端找到要连接的服务器。"),
                json!({"participation":"observe","mcp_tool":{"name":"inventory","arguments":{}}}),
                speak("未配置本机工具目录。"),
                json!({"participation":"observe","news_search":{"query":"月球探测 最新公开新闻"}}),
                speak("暂未检索到可核实的来源，不能把消息当作已证实。"),
                json!({"participation":"observe","local_action":{"operation":"list_workspace"}}),
                write.clone(),
                speak("工作区里有 note.md。本地工具仍然开启。"),
                write,
                speak("请由本机用户提出保存请求。"),
            ];
            let (mut agent, secrets, key, received, server) = model_fixture(&worker, replies).await;
            agent.agent_type = AgentType::Tool;
            agent.local_tools_enabled = Some(true);
            let agent = worker.call(move |database| {
                let news = database.get_news_configuration("actor-tests")?;
                database.save_news_configuration(NewsConfigurationSaveRequest {
                    data_generation_id: "actor-tests".into(), client_request_id: Uuid::now_v7().to_string(),
                    expected_revision: news.revision, configuration: NewsConfiguration {
                        enabled: true, proxy_enabled: true, proxy_mode: NewsProxyMode::Manual, proxy_url: String::new(), ..news.configuration
                    },
                })?;
                Ok(database.save_agent(AgentSaveRequest {
                    data_generation_id: "actor-tests".into(), client_request_id: Uuid::now_v7().to_string(),
                    expected_revision: Some(agent.revision.clone()), configuration: agent,
                })?.0)
            }).await.unwrap();
            let workspace = local_tools::workspace_directory(directory.path(), &agent.agent_id, true).unwrap().unwrap();
            std::fs::write(workspace.join("note.md"), "已有稿件").unwrap();
            let models = Ok(Arc::new(ModelGateway::new().unwrap()));
            let services = Ok(secrets.clone());
            let cancellation = CancellationToken::new();
            let mut count = 0;
            let mut answers = Vec::new();
            for (text, local_user) in [
                ("解释一下 DNS", true),
                ("使用登记过的本机工具查看清单", true),
                ("查询月球探测的最新公开新闻", true),
                ("你那儿收着哪些稿子？本地工具还开着吗？", true),
                ("请帮我保存草稿。", false),
            ] {
                let source = worker.send_message(ChatSendRequest {
                    data_generation_id: "actor-tests".into(), client_request_id: Uuid::now_v7().to_string(),
                    parts: vec![MessagePart::Text { text: text.into() }], quote_message_id: None,
                    mention_ids: vec![agent.agent_id.clone()], mention_all: false,
                }).await.unwrap();
                if !local_user {
                    let agent_id = agent.agent_id.clone();
                    let message_id = source.message_id.clone();
                    worker.call(move |database| {
                        let peer = database.list_agents("actor-tests")?.into_iter().find(|peer| peer.agent_id != agent_id).unwrap();
                        database.conn.execute("UPDATE messages SET sender_id=?1 WHERE id=?2", rusqlite::params![peer.agent_id, message_id])?;
                        Ok(())
                    }).await.unwrap();
                }
                let opportunity = Opportunity { chain_id: source.message_id, reason: "tool_request", message_seq: source.message_seq.clone(), mention_seq: source.message_seq };
                let result = make_decision(&agent, &worker, &models, &services, &opportunity, &0.into(), &cancellation, &mut count).await.unwrap();
                answers.push(decision::tool_answer(&result.decision).unwrap());
            }
            secrets.delete(&key).unwrap();
            server.join().unwrap();
            assert_eq!(count, 10);
            assert!(answers[0].contains("域名解析"));
            assert!(answers[1].contains("未配置本机工具目录"));
            assert!(answers[2].contains("未检索到可核实"));
            assert_eq!(answers[3], "工作区里有 note.md。本地工具仍然开启。");
            assert_eq!(answers[4], "请由本机用户提出保存请求。");
            assert!(!workspace.join("denied.txt").exists());
            let prompts: Vec<String> = received.try_iter().map(|body| body["messages"][1]["content"].as_str().unwrap().to_owned()).collect();
            assert_eq!(prompts.len(), 10);
            let prompt = |index: usize| serde_json::from_str::<Value>(prompts[index].lines().next().unwrap()).unwrap();
            let initial = prompt(0);
            assert!(initial.get("local_reference").is_none());
            assert_eq!(initial["tool_results"], json!([]));
            assert_eq!(initial["local_tools"], json!({"enabled":true,"turn_state":"ready","allowed_operations":["system_info","list_workspace","write_text"]}));
            assert_eq!(prompt(1)["mcp_tools"], json!([]));
            assert_eq!(prompt(2)["tool_results"][0]["operation"], "mcp_tool");
            assert_eq!(prompt(2)["tool_results"][0]["ok"], false);
            assert_eq!(prompt(4)["news_search_available"], false);
            assert_eq!(prompt(4)["news_search_result"]["query"], "月球探测 最新公开新闻");
            assert_eq!(prompt(4)["news_search_result"]["result"]["items"], json!([]));
            assert_eq!(prompt(5)["local_tools"], initial["local_tools"]);
            let listed = prompt(6);
            assert_eq!(listed["local_tools"], json!({"enabled":true,"turn_state":"already_used","allowed_operations":[]}));
            assert_eq!(listed["remaining_tool_steps"], 1);
            assert_eq!(listed["tool_results"][0]["operation"], "list_workspace");
            assert_eq!(listed["tool_results"][0]["ok"], true);
            assert!(listed["tool_results"][0]["result"].as_str().unwrap().contains("note.md"));
            let retried = prompt(7);
            assert_eq!(retried["local_tools"], listed["local_tools"]);
            assert_eq!(retried["remaining_tool_steps"], 0);
            assert_eq!(retried["tool_results"][1]["operation"], "write_text");
            assert_eq!(retried["tool_results"][1]["ok"], false);
            assert!(retried["tool_results"][1]["result"].as_str().unwrap().contains("本轮已经尝试过"));
            let peer = prompt(8);
            assert_eq!(peer["local_tools"], json!({"enabled":true,"turn_state":"requires_local_user","allowed_operations":[]}));
            assert_eq!(prompt(9)["local_tools"], peer["local_tools"]);
            assert_eq!(prompt(9)["remaining_tool_steps"], peer["remaining_tool_steps"]);
            assert_eq!(prompt(9)["tool_results"], json!([]));
            assert!(prompts[9].contains(decision::tool_retry_hint()));
            worker.shutdown().await.unwrap();
        });
    }

    #[test]
    fn idle_respects_model_silence_and_retries_overlong_openers() {
        use serde_json::json;
        tauri::async_runtime::block_on(async {
            let (_directory, worker, _agent, _events) = fixture().await;
            let previous = "站台的热饮柜只收现金。";
            worker.send_message(ChatSendRequest {
                data_generation_id: "actor-tests".into(), client_request_id: Uuid::now_v7().to_string(),
                parts: vec![MessagePart::Text { text: previous.into() }],
                quote_message_id: None, mention_ids: vec![], mention_all: false,
            }).await.unwrap();
            let opening = "带饭我喜欢用玻璃盒，加热后不会留味。";
            let speak = |text: &str| json!({"participation":"speak","messages":[{"parts":[{"kind":"text","text":text}]}]});
            let (agent, secrets, key, received, server) = model_fixture(&worker, vec![
                json!({"participation":"observe"}), json!({"participation":"observe"}),
                speak(&"字".repeat(49)), speak(opening),
            ]).await;
            let models = Ok(Arc::new(ModelGateway::new().unwrap()));
            let secrets_store = Ok(secrets.clone());
            let mut count = 0;
            let mut results = Vec::new();
            for _ in 0..2 {
                let opportunity = Opportunity { reason: "idle_tick", chain_id: Uuid::now_v7().to_string(), ..initialized() };
                results.push(make_decision(&agent, &worker, &models, &secrets_store, &opportunity,
                    &0.into(), &CancellationToken::new(), &mut count).await);
            }
            secrets.delete(&key).unwrap();
            let results: Vec<_> = results.into_iter().map(Result::unwrap).collect();
            assert_eq!(results[0].decision.participation, Participation::Observe);
            assert_eq!(results[1].decision.participation, Participation::Speak);
            assert_eq!(count, 2);
            server.join().unwrap();
            let prompts: Vec<_> = received.try_iter().map(|body| body["messages"][1]["content"].as_str().unwrap().to_owned()).collect();
            assert_eq!(prompts.len(), 4);
            assert!(prompts[1].contains("上一次没有开口"));
            assert!(prompts[3].contains("单条超出字数"));
            let page = worker.list_messages(ChatListRequest {
                data_generation_id: "actor-tests".into(), before_seq: None, after_seq: None, around_seq: None, limit: 10,
            }).await.unwrap();
            assert_eq!(page.items.len(), 2);
            assert_eq!(style::body(&page.items.last().unwrap().parts), opening);
            worker.shutdown().await.unwrap();
        });
    }

    #[test]
    fn room_idle_attempts_are_bounded_and_serialized() {
        for seed in [0, 1, 123456, u64::MAX] {
            assert!((77..=130).contains(&idle_interval(70, seed, false).as_secs()));
            assert!(idle_interval(100, seed, false) < idle_interval(0, seed, false));
            assert!((800..3000).contains(&reading_delay_ms(true, seed)));
            assert!((1500..8500).contains(&reading_delay_ms(false, seed)));
        }
        let room = tokio::sync::Mutex::new(None);
        let now = tokio::time::Instant::now();
        let first = claim_idle_slot(&room, now, 0).unwrap();
        assert!(claim_idle_slot(&room, now + ROOM_IDLE_SPACING, 0).is_err());
        drop(first);
        assert_eq!(claim_idle_slot(&room, now, 0).unwrap_err(), now + ROOM_IDLE_SPACING);
        assert!(claim_idle_slot(&room, now + ROOM_IDLE_SPACING, 0).is_ok());
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
