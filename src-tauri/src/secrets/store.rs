use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use keyring_core::{Entry, api::CredentialStoreApi};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::{
    contracts::{AppError, ErrorCode, ModelProtocol},
    error::AppResult,
};

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct BoundSecret {
    endpoint: String,
    protocol: ModelProtocol,
    value: String,
}

pub struct SecretStore {
    namespace: String,
    store: Arc<windows_native_keyring_store::Store>,
    gate: Mutex<()>,
}

fn storage_error() -> AppError {
    AppError::new(
        ErrorCode::IoError,
        "无法访问操作系统凭据库，请检查当前用户权限。",
    )
}

impl SecretStore {
    pub fn new(namespace: String) -> AppResult<Self> {
        let store = windows_native_keyring_store::Store::new().map_err(|_| storage_error())?;
        Ok(Self {
            namespace,
            store,
            gate: Mutex::new(()),
        })
    }

    fn entry(&self, reference: &str) -> AppResult<Entry> {
        if Uuid::parse_str(reference).is_err() {
            return Err(AppError::invalid("credential_ref", "凭据引用无效。"));
        }
        let modifiers = HashMap::from([("persistence", "Local")]);
        self.store
            .build(&self.namespace, reference, Some(&modifiers))
            .map_err(|_| storage_error())
    }

    pub fn create(
        &self,
        value: &str,
        endpoint: &str,
        protocol: &ModelProtocol,
    ) -> AppResult<String> {
        if value.trim().is_empty() || value.len() > 2048 || value.chars().any(char::is_control) {
            return Err(AppError::invalid(
                "api_key",
                "API Key 不能为空、过长或包含控制字符。",
            ));
        }
        let _gate = self.gate.lock().map_err(|_| storage_error())?;
        let reference = Uuid::now_v7().to_string();
        let payload = serde_json::to_string(&BoundSecret {
            endpoint: endpoint.into(),
            protocol: protocol.clone(),
            value: value.into(),
        })
        .map_err(|_| storage_error())?;
        self.entry(&reference)?
            .set_password(&payload)
            .map_err(|_| storage_error())?;
        Ok(reference)
    }

    pub(crate) fn read(
        &self,
        reference: &str,
        endpoint: &str,
        protocol: &ModelProtocol,
    ) -> AppResult<String> {
        let _gate = self.gate.lock().map_err(|_| storage_error())?;
        let payload = self
            .entry(reference)?
            .get_password()
            .map_err(|error| match error {
                keyring_core::Error::NoEntry => AppError::new(
                    ErrorCode::CapabilityUnsupported,
                    "此模型尚未设置 API 凭据。",
                ),
                _ => storage_error(),
            })?;
        let payload: BoundSecret = serde_json::from_str(&payload).map_err(|_| storage_error())?;
        if payload.endpoint != endpoint || &payload.protocol != protocol {
            return Err(AppError::new(
                ErrorCode::PermissionDenied,
                "凭据与模型端点或协议不匹配，请重新设置。",
            ));
        }
        Ok(payload.value)
    }

    pub fn configured(
        &self,
        reference: &str,
        endpoint: &str,
        protocol: &ModelProtocol,
    ) -> AppResult<bool> {
        match self.read(reference, endpoint, protocol) {
            Ok(_) => Ok(true),
            Err(error)
                if matches!(
                    error.code,
                    ErrorCode::CapabilityUnsupported | ErrorCode::PermissionDenied
                ) =>
            {
                Ok(false)
            }
            Err(error) => Err(error),
        }
    }

    pub fn delete(&self, reference: &str) -> AppResult<()> {
        let _gate = self.gate.lock().map_err(|_| storage_error())?;
        match self.entry(reference)?.delete_credential() {
            Ok(()) | Err(keyring_core::Error::NoEntry) => Ok(()),
            Err(_) => Err(storage_error()),
        }
    }
}
