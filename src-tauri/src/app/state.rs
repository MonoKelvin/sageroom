use std::{
    path::PathBuf,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
};

use tauri::{AppHandle, Emitter};
use tokio::sync::Semaphore;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

use crate::{
    domain::{contracts::*, error::AppResult},
    models::ModelGateway,
    runtime::RuntimeSupervisor,
    secrets::store::SecretStore,
    storage::worker::DbWorker,
};

pub struct AppState {
    pub generation: String,
    data_directory: Option<PathBuf>,
    storage: Mutex<AppResult<Arc<DbWorker>>>,
    storage_initialized: bool,
    secrets: AppResult<Arc<SecretStore>>,
    models: AppResult<Arc<ModelGateway>>,
    model_shutdown: Mutex<CancellationToken>,
    runtime: Arc<RuntimeSupervisor>,
    pub exits: super::lifecycle::ExitCoordinator,
    recovering: AtomicBool,
    recovery_worker: Mutex<Option<Arc<DbWorker>>>,
    exit_completed: AtomicBool,
    pub avatar_gate: Semaphore,
    shutting_down: AtomicBool,
}

impl AppState {
    pub fn open(directory: tauri::Result<PathBuf>, app: AppHandle) -> Self {
        let generation = Uuid::now_v7().to_string();
        let secrets = SecretStore::new(app.config().identifier.clone()).map(Arc::new);
        let models = ModelGateway::new().map(Arc::new);
        let runtime = RuntimeSupervisor::new();
        let event_runtime = runtime.clone();
        let data_directory = directory.as_ref().ok().map(|path| path.join("data"));
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
                        event_runtime.publish(event);
                        let _ = app.emit("sageroom://domain", event);
                    }),
                )
            });
        if let Ok(worker) = &storage {
            runtime.start(worker.clone(), models.clone(), secrets.clone());
        }
        Self {
            generation,
            data_directory,
            storage_initialized: storage.is_ok(),
            storage: Mutex::new(storage),
            secrets,
            models,
            model_shutdown: Mutex::new(CancellationToken::new()),
            runtime,
            exits: super::lifecycle::ExitCoordinator::default(),
            recovering: AtomicBool::new(false),
            recovery_worker: Mutex::new(None),
            exit_completed: AtomicBool::new(false),
            avatar_gate: Semaphore::new(1),
            shutting_down: AtomicBool::new(false),
        }
    }

    pub fn worker(&self) -> AppResult<Arc<DbWorker>> {
        if self.is_shutting_down() || self.recovering.load(Ordering::Acquire) {
            return Err(AppError::new(
                ErrorCode::ShuttingDown,
                "应用正在退出，未启动新的操作。",
            ));
        }
        self.storage.lock().expect("存储锁被污染").clone()
    }

    fn experience_root(&self, generation: &str) -> AppResult<PathBuf> {
        if generation != self.generation {
            return Err(AppError::new(
                ErrorCode::ConfigConflict,
                "数据版本已改变，请重新读取后再操作。",
            ));
        }
        self.data_directory.clone().ok_or_else(|| {
            AppError::new(ErrorCode::IoError, "无法获取应用数据目录。")
        })
    }

    async fn ensure_agent(&self, generation: &str, agent_id: &str) -> AppResult<()> {
        let agents = self.worker()?.list_agents(AgentListRequest {
            data_generation_id: generation.to_owned(),
        }).await?;
        if !agents.iter().any(|agent| agent.agent_id == agent_id) {
            return Err(AppError::invalid("agent_id", "智能体不存在。"));
        }
        Ok(())
    }

    pub async fn experience_list(&self, request: ExperienceAgentRequest) -> AppResult<Vec<ExperienceEntry>> {
        let root = self.experience_root(&request.data_generation_id)?;
        self.ensure_agent(&request.data_generation_id, &request.agent_id).await?;
        crate::storage::experience::list(&root, &request.agent_id)
    }

    pub async fn experience_add(&self, request: ExperienceAddRequest) -> AppResult<ExperienceEntry> {
        let root = self.experience_root(&request.data_generation_id)?;
        self.ensure_agent(&request.data_generation_id, &request.agent_id).await?;
        crate::storage::experience::add(&root, &request.agent_id, &request.content, request.score)
    }

    pub async fn experience_delete(&self, request: ExperienceDeleteRequest) -> AppResult<Vec<ExperienceEntry>> {
        let root = self.experience_root(&request.data_generation_id)?;
        self.ensure_agent(&request.data_generation_id, &request.agent_id).await?;
        crate::storage::experience::delete(&root, &request.agent_id, &request.entry_id)
    }

    pub async fn experience_prune(&self, request: ExperiencePruneRequest) -> AppResult<Vec<ExperienceEntry>> {
        let root = self.experience_root(&request.data_generation_id)?;
        self.ensure_agent(&request.data_generation_id, &request.agent_id).await?;
        crate::storage::experience::prune(&root, &request.agent_id, request.max_entries as usize)
    }

    pub async fn global_configuration(
        &self,
        request: GlobalConfigurationGetRequest,
    ) -> AppResult<GlobalConfiguration> {
        let (configuration, references) = self
            .worker()?
            .call(move |database| {
                let configuration =
                    database.get_global_configuration(&request.data_generation_id)?;
                let references = configuration
                    .model_profiles
                    .iter()
                    .map(|profile| {
                        database
                            .get_model_profile_internal(&profile.id)
                            .map(|(_, reference)| reference)
                    })
                    .collect::<AppResult<Vec<_>>>()?;
                Ok((configuration, references))
            })
            .await?;
        if references.iter().all(Option::is_none) {
            return Ok(configuration);
        }
        let secrets = self.secrets.clone()?;
        tauri::async_runtime::spawn_blocking(move || {
            let mut configuration = configuration;
            for (profile, reference) in configuration.model_profiles.iter_mut().zip(references) {
                profile.credential_configured = if let Some(reference) = reference {
                    secrets.configured(&reference, &profile.base_url, &profile.protocol)?
                } else {
                    false
                };
            }
            Ok(configuration)
        })
        .await
        .map_err(|_| AppError::new(ErrorCode::InternalError, "读取凭据状态未完成。"))?
    }

    async fn checked_profile(
        &self,
        generation: String,
        id: String,
        revision: DecimalString,
    ) -> AppResult<(ModelProfile, Option<String>)> {
        self.worker()?
            .call(move |database| {
                database.check_generation(&generation)?;
                let profile = database.get_model_profile_internal(&id)?;
                if profile.0.revision != revision {
                    return Err(AppError::new(
                        ErrorCode::ConfigConflict,
                        "模型配置已改变，请重新读取后确认操作。",
                    ));
                }
                Ok(profile)
            })
            .await
    }

    pub async fn secret_status(&self, request: SecretStatusRequest) -> AppResult<SecretStatus> {
        let (profile, reference) = self
            .checked_profile(
                request.data_generation_id,
                request.profile_id,
                request.expected_revision,
            )
            .await?;
        let configured = if let Some(reference) = reference {
            let secrets = self.secrets.clone()?;
            let endpoint = profile.base_url.clone();
            let protocol = profile.protocol.clone();
            tauri::async_runtime::spawn_blocking(move || {
                secrets.configured(&reference, &endpoint, &protocol)
            })
            .await
            .map_err(|_| AppError::new(ErrorCode::InternalError, "读取凭据状态未完成。"))??
        } else {
            false
        };
        Ok(SecretStatus {
            profile_id: profile.id,
            configured,
        })
    }

    pub async fn set_secret(&self, request: SecretSetRequest) -> AppResult<SecretStatus> {
        let (profile, _) = self
            .checked_profile(
                request.data_generation_id.clone(),
                request.profile_id.clone(),
                request.expected_revision.clone(),
            )
            .await?;
        crate::storage::configuration::require_configured_profile(&profile.input())?;
        let secrets = self.secrets.clone()?;
        let worker = self.worker()?;
        let creator = secrets.clone();
        let endpoint = profile.base_url;
        let protocol = profile.protocol;
        let reference = tauri::async_runtime::spawn_blocking(move || {
            creator.create(&request.api_key, &endpoint, &protocol)
        })
        .await
        .map_err(|_| AppError::new(ErrorCode::InternalError, "保存凭据未完成。"))??;
        let result = worker
            .set_credential_reference(
                request.data_generation_id,
                request.profile_id.clone(),
                request.expected_revision,
                Some(reference.clone()),
            )
            .await;
        if let Err(error) = result {
            let cleanup =
                tauri::async_runtime::spawn_blocking(move || secrets.delete(&reference)).await;
            if !matches!(cleanup, Ok(Ok(()))) {
                return Err(AppError::new(
                    ErrorCode::IoError,
                    "配置未提交，新凭据补偿未完成；旧凭据未覆盖。",
                ));
            }
            return Err(error);
        }
        Ok(SecretStatus {
            profile_id: request.profile_id,
            configured: true,
        })
    }

    pub async fn test_model(&self, request: ModelProfileTestRequest) -> AppResult<ModelTestResult> {
        let (profile, reference) = self
            .checked_profile(
                request.data_generation_id,
                request.profile_id,
                request.expected_revision,
            )
            .await?;
        crate::storage::configuration::require_configured_profile(&profile.input())?;
        let reference = reference.ok_or_else(|| {
            AppError::new(
                ErrorCode::CapabilityUnsupported,
                "请先设置此模型的 API 凭据。",
            )
        })?;
        let secrets = self.secrets.clone()?;
        let endpoint = profile.base_url.clone();
        let protocol = profile.protocol.clone();
        let key = tauri::async_runtime::spawn_blocking(move || {
            secrets.read(&reference, &endpoint, &protocol)
        })
        .await
        .map_err(|_| AppError::new(ErrorCode::InternalError, "读取模型凭据未完成。"))??;
        let cancellation = self.model_shutdown.lock().expect("模型锁被污染").clone();
        self.worker()?
            .reserve_runtime_request(format!("test:{}", profile.id), 20)
            .await?;
        self.models.clone()?.test(profile, key, cancellation).await
    }

    pub async fn list_models(&self, request: ModelListRequest) -> AppResult<ModelListResult> {
        let (profile, reference) = self
            .checked_profile(
                request.data_generation_id,
                request.profile_id,
                request.expected_revision,
            )
            .await?;
        crate::storage::configuration::require_configured_profile(&profile.input())?;
        let reference = reference.ok_or_else(|| {
            AppError::new(
                ErrorCode::CapabilityUnsupported,
                "请先设置此模型的 API 凭据。",
            )
        })?;
        let secrets = self.secrets.clone()?;
        let endpoint = profile.base_url.clone();
        let protocol = profile.protocol.clone();
        let key = tauri::async_runtime::spawn_blocking(move || {
            secrets.read(&reference, &endpoint, &protocol)
        })
        .await
        .map_err(|_| AppError::new(ErrorCode::InternalError, "读取模型凭据未完成。"))??;
        let profile_id = profile.id.clone();
        let cancellation = self.model_shutdown.lock().expect("模型锁被污染").clone();
        let models = self.models.clone()?.list_models(profile, key, cancellation).await?;
        Ok(ModelListResult { profile_id, models })
    }

    pub async fn import_development_model(
        &self,
        request: DevelopmentModelImportRequest,
    ) -> AppResult<GlobalConfiguration> {
        if !cfg!(debug_assertions) {
            return Err(AppError::new(
                ErrorCode::CapabilityUnsupported,
                "开发模型导入只在开发版本中可用。",
            ));
        }
        let mut current = self
            .worker()?
            .get_global_configuration(GlobalConfigurationGetRequest {
                data_generation_id: request.data_generation_id.clone(),
            })
            .await?;
        let specification = tauri::async_runtime::spawn_blocking(super::development_model::read)
            .await
            .map_err(|_| AppError::new(ErrorCode::InternalError, "读取开发模型配置未完成。"))??;
        let mut profile = specification.profile;
        if let Some(existing) = current.model_profiles.iter().find(|existing| {
            existing.base_url == profile.base_url
                && existing.model_name == profile.model_name
                && existing.protocol == profile.protocol
        }) {
            profile = existing.input();
        }
        let profile_id = profile.id.clone();
        let mut profiles = current
            .model_profiles
            .iter()
            .map(ModelProfile::input)
            .collect::<Vec<_>>();
        if !profiles.iter().any(|existing| existing.id == profile_id) {
            profiles.push(profile);
        }
        current = self
            .worker()?
            .save_global_configuration(GlobalConfigurationSaveRequest {
                data_generation_id: request.data_generation_id.clone(),
                client_request_id: Uuid::now_v7().to_string(),
                expected_revision: current.revision,
                model_profiles: profiles,
                persona_presets: current.persona_presets,
            })
            .await?;
        let revision = current
            .model_profiles
            .iter()
            .find(|profile| profile.id == profile_id)
            .ok_or_else(|| AppError::new(ErrorCode::InternalError, "开发模型预设未保存。"))?
            .revision
            .clone();
        self.set_secret(SecretSetRequest {
            data_generation_id: request.data_generation_id.clone(),
            profile_id,
            expected_revision: revision,
            api_key: specification.api_key,
        })
        .await?;
        self.global_configuration(GlobalConfigurationGetRequest {
            data_generation_id: request.data_generation_id,
        })
        .await
    }

    pub async fn control_agent_runtime(
        &self,
        request: AgentRuntimeControlRequest,
    ) -> AppResult<AgentRuntimeState> {
        let worker = self.worker()?;
        let generation = request.data_generation_id;
        worker
            .call(move |database| database.check_generation(&generation))
            .await?;
        let state = worker
            .set_runtime_paused(request.agent_id.clone(), request.paused)
            .await?;
        self.runtime.restart_agent(request.agent_id);
        Ok(state)
    }

    pub fn is_shutting_down(&self) -> bool {
        self.shutting_down.load(Ordering::Acquire)
    }

    pub fn has_initialized_storage(&self) -> bool {
        self.storage_initialized
    }

    pub fn is_recovering(&self) -> bool {
        self.recovering.load(Ordering::Acquire)
    }

    pub fn exit_completed(&self) -> bool {
        self.exit_completed.load(Ordering::Acquire)
    }

    pub fn complete_exit(&self) {
        self.exit_completed.store(true, Ordering::Release);
    }

    pub fn begin_shutdown(&self) -> AppResult<Option<Arc<DbWorker>>> {
        if self.recovering.load(Ordering::Acquire) {
            return Err(AppError::new(
                ErrorCode::ShuttingDown,
                "数据正在恢复，请稍后重新退出。",
            ));
        }
        let storage = self.storage.lock().expect("存储锁被污染").clone();
        if self.storage_initialized && storage.is_err() {
            return Err(storage.err().expect("存储错误"));
        }
        if self.shutting_down.swap(true, Ordering::AcqRel) {
            return Err(AppError::new(ErrorCode::ShuttingDown, "退出已经开始。"));
        }
        self.runtime.shutdown();
        self.model_shutdown.lock().expect("模型锁被污染").cancel();
        Ok(self
            .storage
            .lock()
            .expect("存储锁被污染")
            .as_ref()
            .ok()
            .cloned())
    }

    pub fn start_recovery(&self) {
        self.recovering.store(true, Ordering::Release);
        *self.recovery_worker.lock().expect("恢复锁被污染") = self
            .storage
            .lock()
            .expect("存储锁被污染")
            .as_ref()
            .ok()
            .cloned();
        self.shutting_down.store(false, Ordering::Release);
    }

    pub fn retry_recovery(&self) -> Option<Arc<DbWorker>> {
        let worker = self.recovery_worker.lock().expect("恢复锁被污染").clone()?;
        if self.recovering.swap(true, Ordering::AcqRel) {
            return None;
        }
        Some(worker)
    }

    pub fn finish_recovery(&self, storage: AppResult<Arc<DbWorker>>) {
        if let Ok(worker) = &storage {
            self.runtime
                .start(worker.clone(), self.models.clone(), self.secrets.clone());
        }
        if storage.is_ok() {
            *self.recovery_worker.lock().expect("恢复锁被污染") = None;
        }
        *self.storage.lock().expect("存储锁被污染") = storage;
        *self.model_shutdown.lock().expect("模型锁被污染") = CancellationToken::new();
        self.recovering.store(false, Ordering::Release);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn fixture(worker: AppResult<Arc<DbWorker>>) -> AppState {
        AppState {
            generation: "state-tests".into(),
            data_directory: None,
            storage_initialized: worker.is_ok(),
            storage: Mutex::new(worker),
            secrets: Err(AppError::new(
                ErrorCode::CapabilityUnsupported,
                "测试禁止访问系统凭据。",
            )),
            models: Err(AppError::new(
                ErrorCode::CapabilityUnsupported,
                "测试禁止访问网络。",
            )),
            model_shutdown: Mutex::new(CancellationToken::new()),
            runtime: RuntimeSupervisor::new(),
            exits: super::super::lifecycle::ExitCoordinator::default(),
            recovering: AtomicBool::new(false),
            recovery_worker: Mutex::new(None),
            exit_completed: AtomicBool::new(false),
            avatar_gate: Semaphore::new(1),
            shutting_down: AtomicBool::new(false),
        }
    }

    #[test]
    fn incomplete_profile_secret_and_test_preflight_never_reach_credentials_or_network() {
        for (url, model) in [
            ("", ""),
            ("https://example.invalid/v1", ""),
            ("", "fixture-model"),
        ] {
            let directory = TempDir::new().unwrap();
            let worker =
                DbWorker::open(directory.path(), "state-tests".into(), Arc::new(|_| {})).unwrap();
            let state = fixture(Ok(worker.clone()));
            let current = tauri::async_runtime::block_on(worker.get_global_configuration(
                GlobalConfigurationGetRequest {
                    data_generation_id: state.generation.clone(),
                },
            ))
            .unwrap();
            let saved = tauri::async_runtime::block_on(worker.save_global_configuration(
                GlobalConfigurationSaveRequest {
                    data_generation_id: state.generation.clone(),
                    client_request_id: "incomplete-state-profile".into(),
                    expected_revision: current.revision,
                    model_profiles: vec![ModelProfileInput {
                        id: "incomplete".into(),
                        name: "未配置预设".into(),
                        protocol: ModelProtocol::OpenaiChatCompletions,
                        base_url: url.into(),
                        model_name: model.into(),
                    }],
                    persona_presets: current.persona_presets,
                },
            ))
            .unwrap();
            let revision = saved.model_profiles[0].revision.clone();
            let error = tauri::async_runtime::block_on(state.set_secret(SecretSetRequest {
                data_generation_id: state.generation.clone(),
                profile_id: "incomplete".into(),
                expected_revision: revision.clone(),
                api_key: "test-only-never-used".into(),
            }))
            .unwrap_err();
            assert_eq!(error.code, ErrorCode::InvalidInput);
            let error = tauri::async_runtime::block_on(state.test_model(ModelProfileTestRequest {
                data_generation_id: state.generation.clone(),
                profile_id: "incomplete".into(),
                expected_revision: revision,
            }))
            .unwrap_err();
            assert_eq!(error.code, ErrorCode::InvalidInput);
            tauri::async_runtime::block_on(worker.shutdown()).unwrap();
        }
    }

    #[test]
    fn failed_shutdown_state_recovers_and_initialization_failure_does_not_require_snapshot() {
        let directory = TempDir::new().unwrap();
        let worker =
            DbWorker::open(directory.path(), "state-tests".into(), Arc::new(|_| {})).unwrap();
        let state = fixture(Ok(worker.clone()));
        assert!(state.begin_shutdown().unwrap().is_some());
        assert!(state.is_shutting_down());
        assert!(!state.exit_completed());
        state.start_recovery();
        assert!(!state.is_shutting_down());
        assert_eq!(state.worker().err().unwrap().code, ErrorCode::ShuttingDown);
        assert!(state.begin_shutdown().is_err());
        state.finish_recovery(Err(AppError::new(ErrorCode::IoError, "临时恢复故障。")));
        assert!(state.has_initialized_storage()); // 不是初始化失败，不能直接退出。
        assert!(state.begin_shutdown().is_err());
        let retry = state
            .retry_recovery()
            .expect("恢复失败保留真实工作线程以供重试");
        assert!(state.is_recovering());
        assert!(state.retry_recovery().is_none());
        tauri::async_runtime::block_on(worker.clone().shutdown()).unwrap();
        let reopened = retry.recover().unwrap();
        state.finish_recovery(Ok(reopened));
        assert!(state.worker().is_ok());
        assert!(!state.model_shutdown.lock().unwrap().is_cancelled());
        let worker = state.begin_shutdown().unwrap().unwrap();
        tauri::async_runtime::block_on(worker.shutdown()).unwrap();
        state.complete_exit();
        assert!(state.exit_completed());
        let unavailable = fixture(Err(AppError::new(ErrorCode::IoError, "初始化失败。")));
        assert!(!unavailable.has_initialized_storage());
        assert!(unavailable.begin_shutdown().unwrap().is_none());
    }
}
