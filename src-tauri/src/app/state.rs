use std::{
    path::PathBuf,
    sync::{
        Arc,
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
    secrets::store::SecretStore,
    storage::worker::DbWorker,
};

pub struct AppState {
    pub generation: String,
    storage: AppResult<Arc<DbWorker>>,
    secrets: AppResult<Arc<SecretStore>>,
    models: AppResult<Arc<ModelGateway>>,
    model_shutdown: CancellationToken,
    pub avatar_gate: Semaphore,
    shutting_down: AtomicBool,
}

impl AppState {
    pub fn open(directory: tauri::Result<PathBuf>, app: AppHandle) -> Self {
        let generation = Uuid::now_v7().to_string();
        let secrets = SecretStore::new(app.config().identifier.clone()).map(Arc::new);
        let models = ModelGateway::new().map(Arc::new);
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
            secrets,
            models,
            model_shutdown: CancellationToken::new(),
            avatar_gate: Semaphore::new(1),
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

    pub async fn delete_secret(&self, request: SecretDeleteRequest) -> AppResult<SecretStatus> {
        self.checked_profile(
            request.data_generation_id.clone(),
            request.profile_id.clone(),
            request.expected_revision.clone(),
        )
        .await?;
        self.worker()?
            .set_credential_reference(
                request.data_generation_id,
                request.profile_id.clone(),
                request.expected_revision,
                None,
            )
            .await?;
        Ok(SecretStatus {
            profile_id: request.profile_id,
            configured: false,
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
        self.models
            .clone()?
            .test(profile, key, self.model_shutdown.clone())
            .await
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
                runtime_defaults: current.runtime_defaults,
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

    pub fn is_shutting_down(&self) -> bool {
        self.shutting_down.load(Ordering::Acquire)
    }

    pub fn begin_shutdown(&self) -> Option<AppResult<Arc<DbWorker>>> {
        if self.shutting_down.swap(true, Ordering::AcqRel) {
            None
        } else {
            self.model_shutdown.cancel();
            Some(self.storage.clone())
        }
    }
}
