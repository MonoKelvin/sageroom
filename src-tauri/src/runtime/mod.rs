mod decision;

use std::{
    collections::{HashMap, HashSet},
    future::pending,
    sync::{Arc, Mutex},
    time::Duration,
};

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
    storage::{runtime::RuntimeMessage, worker::DbWorker},
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

struct Actor {
    revision: DecimalString,
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
                                    data_generation_id: event.data_generation_id,
                                    before_seq: None,
                                    after_seq: None,
                                    around_seq: Some(message_seq.clone()),
                                    limit: 1,
                                })
                                .await;
                            let mentions = page
                                .ok()
                                .and_then(|p| p.items.into_iter().next())
                                .map(|m| (m.mention_ids, m.mention_all))
                                .unwrap_or_default();
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
                                    let mention_seq = if mentions.1 || mentions.0.contains(id) {
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
        let unchanged = actors
            .get(&agent.agent_id)
            .is_some_and(|a| a.revision == agent.revision && !a.opportunities.is_closed());
        if unchanged && !binding_changed && restart != Some(agent.agent_id.as_str()) {
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
                trigger == ReconcileTrigger::NewMessage,
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
        .filter(|(_, _, revision)| {
            restore && revision == &agent.revision && agent.preferences.allow_autonomous_wake
        });
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
            };
        }
        let anchor = tokio::time::Instant::now() + Duration::from_millis(500);
        while tokio::time::Instant::now() < anchor {
            tokio::select! {biased;_=cancellation.cancelled()=>return,_=tokio::time::sleep_until(anchor)=>break,changed=opportunities.changed()=>{if changed.is_err(){return;}opportunity=Some(opportunities.borrow_and_update().clone());}}
        }
        let mut current = opportunity.take().expect("需要有效观察机会");
        let _ = worker
            .save_runtime_plan(
                agent.agent_id.clone(),
                agent.revision.clone(),
                None,
                current.chain_id.clone(),
            )
            .await;
        next = None;
        let mut completed = None;
        for competition in 0..=2 {
            if opportunities.has_changed().unwrap_or(false) {
                current = opportunities.borrow_and_update().clone();
            }
            let result = make_decision(
                &agent,
                &worker,
                &models,
                &secrets,
                &current,
                &cancellation,
                &mut count,
            )
            .await;
            match result {
                Ok(decision) => {
                    completed = Some(decision);
                    break;
                }
                Err(error)
                    if error.code == ErrorCode::ConfigConflict
                        && competition < 2
                        && !cancellation.is_cancelled() => {}
                Err(error) => {
                    report_failure(&worker, &agent, error, count, &cancellation).await;
                    return;
                }
            }
        }
        let Some(completed) = completed else {
            break;
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
    cancellation: &CancellationToken,
    count: &mut u32,
) -> AppResult<CompletedDecision> {
    let mut input = worker.runtime_input(agent.agent_id.clone()).await?;
    if input.agent.revision != agent.revision {
        return Err(AppError::new(ErrorCode::ConfigConflict, "成员配置已改变。"));
    }
    let source = input.agent.model.as_ref().expect("模型已由运行输入校验");
    let endpoint = source.profile.base_url.clone();
    let protocol = source.profile.protocol.clone();
    let reference = input.credential_ref.clone();
    let secrets = secrets.clone()?;
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
        parameters: source.profile.parameters.clone(),
        revision: source.source_profile_revision.clone(),
        credential_configured: true,
    };
    let (system, context) = decision::context(&mut input, opportunity.reason)?;
    let gateway = models.clone()?;
    let mut decision = None;
    for attempt in 0..=1 {
        if cancellation.is_cancelled() {
            return Err(AppError::new(ErrorCode::ShuttingDown, "成员请求已取消。"));
        }
        *count = worker
            .reserve_runtime_request(
                agent.agent_id.clone(),
                agent.preferences.request_limit_daily,
            )
            .await?;
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
        let prompt = if attempt == 1 {
            format!("{context}{}", decision::REPAIR_HINT)
        } else {
            context.clone()
        };
        let reply = gateway
            .chat(
                model.clone(),
                key.clone(),
                system.clone(),
                prompt,
                cancellation.child_token(),
            )
            .await?;
        match decision::parse(&reply.text, &input) {
            Ok(value) => {
                decision = Some(value);
                break;
            }
            Err(error) if attempt == 1 => return Err(error),
            Err(_) => {}
        }
    }
    let decision = decision.expect("合法决策或明确错误");
    let latest = worker.runtime_input(agent.agent_id.clone()).await?;
    if latest.agent.revision != agent.revision
        || latest.snapshot.latest_message_seq != input.snapshot.latest_message_seq
    {
        return Err(AppError::new(
            ErrorCode::ConfigConflict,
            "观察期间有新消息或配置变化，重新判断。",
        ));
    }
    let validated_at = now_ms();
    let mut observed_through_seq = input.snapshot.latest_message_seq.clone();
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
        let decision_id = Uuid::now_v7().to_string();
        for (ordinal, message) in decision.messages.iter().enumerate() {
            tokio::select! {biased;_=cancellation.cancelled()=>return Err(AppError::new(ErrorCode::ShuttingDown,"待发消息已取消。")),_=tokio::time::sleep_until(anchor+Duration::from_millis(message.send_after_ms))=>{}}
            let sent = worker
                .commit_runtime_message(RuntimeMessage {
                    agent_id: agent.agent_id.clone(),
                    config_revision: agent.revision.clone(),
                    observed_through_seq: input.snapshot.latest_message_seq.clone(),
                    decision_id: decision_id.clone(),
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
        ErrorCode::Backpressure | ErrorCode::ConfigConflict => AgentRuntimeStatus::Protected,
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
                    parameters: ModelParameters {
                        temperature: 0.5,
                        top_p: 1.0,
                        max_output_tokens: 1024,
                        input_budget: 4096,
                        reasoning: ReasoningMode::Off,
                    },
                };
                let global = database
                    .save_global_configuration(GlobalConfigurationSaveRequest {
                        data_generation_id: "actor-tests".into(),
                        client_request_id: Uuid::now_v7().to_string(),
                        expected_revision: global.revision,
                        model_profiles: vec![profile],
                        persona_presets: global.persona_presets,
                        runtime_defaults: global.runtime_defaults,
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
                credential_ref: None,
                cancellation: CancellationToken::new(),
                opportunities,
            },
            receiver,
        )
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
                mention_seq: 0.into(),
            });
            tokio::time::timeout(Duration::from_secs(2), recovered.opportunities.closed())
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
                mention_seq: 0.into(),
            });
            tokio::time::timeout(
                Duration::from_secs(2),
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
