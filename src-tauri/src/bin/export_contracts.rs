use std::{collections::BTreeMap, error::Error, fs, path::PathBuf};

use schemars::{
    JsonSchema,
    generate::{Contract, SchemaSettings},
};
use serde_json::Value;
use ts_rs::{Config, TS};

#[allow(dead_code)]
#[path = "../domain/contracts.rs"]
mod contracts;

use contracts::*;

fn export<T: TS + JsonSchema + 'static>(
    name: &str,
    config: &Config,
    schemas: &mut BTreeMap<String, Value>,
) -> Result<(), Box<dyn Error>> {
    T::export_all(config)?;
    let settings = SchemaSettings::draft2020_12().with(|settings| {
        settings.contract = if name.ends_with("Response") || name.ends_with("Event") {
            Contract::Serialize
        } else {
            Contract::Deserialize
        };
    });
    schemas.insert(
        name.to_owned(),
        serde_json::to_value(settings.into_generator().root_schema_for::<T>())?,
    );
    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {
    let output = PathBuf::from(std::env::args_os().nth(1).ok_or("缺少合同输出目录")?);
    fs::create_dir_all(output.join("types"))?;
    let config = Config::new().with_out_dir(output.join("types"));
    let mut schemas = BTreeMap::new();
    export::<AppSnapshotRequest>("AppSnapshotRequest", &config, &mut schemas)?;
    export::<ApiResponse<AppSnapshot>>("AppSnapshotResponse", &config, &mut schemas)?;
    export::<ChatSendRequest>("ChatSendRequest", &config, &mut schemas)?;
    export::<ApiResponse<ChatSendResult>>("ChatSendResponse", &config, &mut schemas)?;
    export::<ChatRecallRequest>("ChatRecallRequest", &config, &mut schemas)?;
    export::<ApiResponse<ChatRecallResult>>("ChatRecallResponse", &config, &mut schemas)?;
    export::<ChatResolveQuotesRequest>("ChatResolveQuotesRequest", &config, &mut schemas)?;
    export::<ApiResponse<Vec<ChatMessage>>>("ChatResolveQuotesResponse", &config, &mut schemas)?;
    export::<ChatListRequest>("ChatListRequest", &config, &mut schemas)?;
    export::<ApiResponse<MessagePage>>("ChatListResponse", &config, &mut schemas)?;
    export::<ChatSearchRequest>("ChatSearchRequest", &config, &mut schemas)?;
    export::<ApiResponse<SearchPage>>("ChatSearchResponse", &config, &mut schemas)?;
    export::<CancelSearchRequest>("CancelSearchRequest", &config, &mut schemas)?;
    export::<ApiResponse<CancelSearchResult>>("CancelSearchResponse", &config, &mut schemas)?;
    export::<RoomSaveRequest>("RoomSaveRequest", &config, &mut schemas)?;
    export::<ApiResponse<Room>>("RoomSaveResponse", &config, &mut schemas)?;
    export::<AppearanceSaveRequest>("AppearanceSaveRequest", &config, &mut schemas)?;
    export::<ApiResponse<Appearance>>("AppearanceSaveResponse", &config, &mut schemas)?;
    export::<ExitRequest>("ExitRequest", &config, &mut schemas)?;
    export::<ApiResponse<ExitResult>>("ExitResponse", &config, &mut schemas)?;
    export::<ExitReadyRequest>("ExitReadyRequest", &config, &mut schemas)?;
    export::<ApiResponse<ExitResult>>("ExitReadyResponse", &config, &mut schemas)?;
    export::<AppLifecycleEvent>("AppLifecycleEvent", &config, &mut schemas)?;
    export::<DomainEvent>("DomainEvent", &config, &mut schemas)?;
    export::<GlobalConfigurationGetRequest>(
        "GlobalConfigurationGetRequest",
        &config,
        &mut schemas,
    )?;
    export::<ApiResponse<GlobalConfiguration>>(
        "GlobalConfigurationGetResponse",
        &config,
        &mut schemas,
    )?;
    export::<GlobalConfigurationSaveRequest>(
        "GlobalConfigurationSaveRequest",
        &config,
        &mut schemas,
    )?;
    export::<ApiResponse<GlobalConfiguration>>(
        "GlobalConfigurationSaveResponse",
        &config,
        &mut schemas,
    )?;
    export::<AgentListRequest>("AgentListRequest", &config, &mut schemas)?;
    export::<ApiResponse<Vec<AgentConfiguration>>>("AgentListResponse", &config, &mut schemas)?;
    export::<AgentSaveRequest>("AgentSaveRequest", &config, &mut schemas)?;
    export::<AgentRuntimeControlRequest>("AgentRuntimeControlRequest", &config, &mut schemas)?;
    export::<ApiResponse<AgentRuntimeState>>("AgentRuntimeControlResponse", &config, &mut schemas)?;
    export::<ApiResponse<AgentConfiguration>>("AgentSaveResponse", &config, &mut schemas)?;
    export::<UserProfileGetRequest>("UserProfileGetRequest", &config, &mut schemas)?;
    export::<ApiResponse<UserProfile>>("UserProfileGetResponse", &config, &mut schemas)?;
    export::<UserProfileSaveRequest>("UserProfileSaveRequest", &config, &mut schemas)?;
    export::<ApiResponse<UserProfile>>("UserProfileSaveResponse", &config, &mut schemas)?;
    export::<SecretSetRequest>("SecretSetRequest", &config, &mut schemas)?;
    export::<ApiResponse<SecretStatus>>("SecretSetResponse", &config, &mut schemas)?;
    export::<SecretStatusRequest>("SecretStatusRequest", &config, &mut schemas)?;
    export::<ApiResponse<SecretStatus>>("SecretStatusResponse", &config, &mut schemas)?;
    export::<ModelProfileTestRequest>("ModelProfileTestRequest", &config, &mut schemas)?;
    export::<ApiResponse<ModelTestResult>>("ModelProfileTestResponse", &config, &mut schemas)?;
    export::<ModelListRequest>("ModelListRequest", &config, &mut schemas)?;
    export::<ApiResponse<ModelListResult>>("ModelListResponse", &config, &mut schemas)?;
    export::<ExperienceAgentRequest>("ExperienceAgentRequest", &config, &mut schemas)?;
    export::<ApiResponse<Vec<ExperienceEntry>>>("ExperienceListResponse", &config, &mut schemas)?;
    export::<ExperienceAddRequest>("ExperienceAddRequest", &config, &mut schemas)?;
    export::<ApiResponse<ExperienceEntry>>("ExperienceAddResponse", &config, &mut schemas)?;
    export::<ExperienceDeleteRequest>("ExperienceDeleteRequest", &config, &mut schemas)?;
    export::<ApiResponse<Vec<ExperienceEntry>>>("ExperienceDeleteResponse", &config, &mut schemas)?;
    export::<ExperiencePruneRequest>("ExperiencePruneRequest", &config, &mut schemas)?;
    export::<ApiResponse<Vec<ExperienceEntry>>>("ExperiencePruneResponse", &config, &mut schemas)?;
    export::<DevelopmentModelImportRequest>(
        "DevelopmentModelImportRequest",
        &config,
        &mut schemas,
    )?;
    export::<ApiResponse<GlobalConfiguration>>(
        "DevelopmentModelImportResponse",
        &config,
        &mut schemas,
    )?;
    export::<AvatarImportRequest>("AvatarImportRequest", &config, &mut schemas)?;
    export::<ApiResponse<Option<AvatarObject>>>("AvatarImportResponse", &config, &mut schemas)?;
    export::<AvatarReadRequest>("AvatarReadRequest", &config, &mut schemas)?;
    export::<ApiResponse<AvatarData>>("AvatarReadResponse", &config, &mut schemas)?;
    AppSnapshot::export_all(&config)?;
    ChatSendResult::export_all(&config)?;
    MessagePage::export_all(&config)?;
    SearchPage::export_all(&config)?;
    CancelSearchResult::export_all(&config)?;
    Appearance::export_all(&config)?;
    ExitResult::export_all(&config)?;
    fs::write(
        output.join("schemas.json"),
        serde_json::to_string_pretty(&schemas)? + "\n",
    )?;
    Ok(())
}
