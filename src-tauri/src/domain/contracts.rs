use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub const TEXT_CHARACTER_LIMIT: usize = 10_000;
pub const TEXT_BYTE_LIMIT: usize = 32 * 1024;
pub const PAGE_LIMIT: u32 = 200;
pub const DEFAULT_PAGE_SIZE: u32 = 50;

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
pub enum SchemaVersion {
    #[serde(rename = "0.3")]
    V0_3,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
pub struct DecimalString(
    #[schemars(length(max = 19), regex(pattern = "^(0|[1-9][0-9]*)$"))] pub String,
);

impl From<i64> for DecimalString {
    fn from(value: i64) -> Self {
        Self(value.to_string())
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ApiSuccess<T> {
    pub schema_version: SchemaVersion,
    pub data: T,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ApiFailure {
    pub schema_version: SchemaVersion,
    pub error: AppError,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(untagged)]
pub enum ApiResponse<T> {
    Success(ApiSuccess<T>),
    Failure(ApiFailure),
}

impl<T> From<Result<T, AppError>> for ApiResponse<T> {
    fn from(result: Result<T, AppError>) -> Self {
        match result {
            Ok(data) => Self::Success(ApiSuccess {
                schema_version: SchemaVersion::V0_3,
                data,
            }),
            Err(error) => Self::Failure(ApiFailure {
                schema_version: SchemaVersion::V0_3,
                error,
            }),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    InvalidInput,
    PermissionDenied,
    DataGenerationChanged,
    IdempotencyConflict,
    ConfigConflict,
    Backpressure,
    ShuttingDown,
    DbBusy,
    DbCorrupt,
    DiskFull,
    IoError,
    SchemaUnsupported,
    DataRootInvalid,
    MessageNotFound,
    SearchCancelled,
    SearchTimeout,
    CapabilityUnsupported,
    InternalError,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Retryability {
    Never,
    Retry,
    AfterUserAction,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AppError {
    pub code: ErrorCode,
    pub message: String,
    pub retryability: Retryability,
    pub field_path: Option<String>,
    pub trace_id: String,
    pub may_have_been_charged: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ParticipantKind {
    User,
    Agent,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ParticipantStatus {
    Present,
    NeedsConfiguration,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentRuntimeStatus {
    NeedsConfiguration,
    Observing,
    Deciding,
    WaitingToSend,
    Sleeping,
    Paused,
    Protected,
    Offline,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct AgentRuntimeState {
    pub agent_id: String,
    pub config_revision: DecimalString,
    pub status: AgentRuntimeStatus,
    pub detail: Option<String>,
    #[ts(type = "number | null")]
    pub next_wake_at: Option<i64>,
    pub requests_today: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AgentRuntimeControlRequest {
    pub data_generation_id: String,
    pub agent_id: String,
    pub paused: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct Participant {
    pub id: String,
    pub kind: ParticipantKind,
    pub display_name: String,
    pub introduction: String,
    pub status: ParticipantStatus,
    pub is_builtin: bool,
    #[serde(default)]
    pub avatar_id: Option<String>,
    #[serde(default = "default_profile_revision")]
    pub profile_revision: DecimalString,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub runtime: Option<AgentRuntimeState>,
}

fn default_profile_revision() -> DecimalString {
    DecimalString("1".into())
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct Room {
    pub id: String,
    pub name: String,
    pub owner_participant_id: String,
    pub version: DecimalString,
    pub content_epoch: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct RoomSaveRequest {
    pub data_generation_id: String,
    pub client_request_id: String,
    pub expected_version: DecimalString,
    pub name: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Theme {
    System,
    Light,
    Dark,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct Appearance {
    pub theme: Theme,
    pub reduce_motion: bool,
    pub revision: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
pub enum MessagePart {
    Text { text: String },
    Attachment { attachment_id: String },
    Emote { emote_id: String },
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct SenderSnapshot {
    pub display_name: String,
    pub kind: ParticipantKind,
    #[serde(default)]
    pub avatar_id: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MessageState {
    Visible,
    Recalled,
    Deleted,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ChatMessage {
    pub id: String,
    pub seq: DecimalString,
    pub sender_id: String,
    pub sender_snapshot: SenderSnapshot,
    #[ts(type = "number")]
    #[schemars(range(min = -9007199254740991.0, max = 9007199254740991.0))]
    pub created_at: i64,
    pub state: MessageState,
    pub parts: Vec<MessagePart>,
    pub quote_message_id: Option<String>,
    pub mention_ids: Vec<String>,
    pub mention_all: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
pub enum EventPayload {
    MessageCommitted {
        message_id: String,
        message_seq: DecimalString,
        sender_id: String,
    },
    AppearanceChanged {
        appearance: Appearance,
    },
    RoomChanged {
        room: Room,
    },
    ParticipantProfileChanged {
        participant: Participant,
    },
    AgentConfigurationChanged {
        agent_id: String,
        revision: DecimalString,
    },
    GlobalConfigurationChanged {
        revision: DecimalString,
    },
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct DomainEvent {
    pub schema_version: SchemaVersion,
    pub data_generation_id: String,
    pub event_seq: DecimalString,
    pub event_id: String,
    #[ts(type = "number")]
    #[schemars(range(min = -9007199254740991.0, max = 9007199254740991.0))]
    pub occurred_at: i64,
    pub payload: EventPayload,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AppSnapshotRequest {
    #[serde(default)]
    pub data_generation_id: Option<String>,
    #[serde(default)]
    pub last_event_seq: Option<DecimalString>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct DataUsage {
    pub database_bytes: DecimalString,
    pub avatar_bytes: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AppSnapshot {
    pub data_generation_id: String,
    pub room: Room,
    pub local_user: Participant,
    pub participants: Vec<Participant>,
    pub appearance: Appearance,
    pub latest_message_seq: DecimalString,
    pub latest_event_seq: DecimalString,
    pub events: Vec<DomainEvent>,
    pub requires_full_reload: bool,
    pub data_directory: String,
    pub data_usage: DataUsage,
    pub app_version: String,
    pub development_tools_available: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ChatSendRequest {
    pub data_generation_id: String,
    pub client_request_id: String,
    pub parts: Vec<MessagePart>,
    #[serde(default)]
    pub quote_message_id: Option<String>,
    pub mention_ids: Vec<String>,
    pub mention_all: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ChatSendResult {
    pub data_generation_id: String,
    pub message_id: String,
    pub message_seq: DecimalString,
    pub event_seq: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ChatListRequest {
    pub data_generation_id: String,
    #[serde(default)]
    pub before_seq: Option<DecimalString>,
    #[serde(default)]
    pub after_seq: Option<DecimalString>,
    #[serde(default)]
    pub around_seq: Option<DecimalString>,
    #[schemars(range(min = 1, max = 200))]
    pub limit: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct MessagePage {
    pub data_generation_id: String,
    pub items: Vec<ChatMessage>,
    pub first_seq: Option<DecimalString>,
    pub last_seq: Option<DecimalString>,
    pub has_more_before: bool,
    pub has_more_after: bool,
    pub latest_message_seq: DecimalString,
    pub latest_event_seq: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ChatSearchRequest {
    pub data_generation_id: String,
    pub search_id: String,
    #[schemars(length(min = 1, max = 256))]
    pub query: String,
    #[serde(default)]
    pub cursor: Option<String>,
    #[schemars(range(min = 1, max = 200))]
    pub limit: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct SearchHit {
    pub message_id: String,
    pub seq: DecimalString,
    pub sender_display_name: String,
    pub snippet: String,
    #[ts(type = "number")]
    #[schemars(range(min = -9007199254740991.0, max = 9007199254740991.0))]
    pub created_at: i64,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(rename_all = "snake_case")]
pub enum SearchSemantics {
    LiteralUnicodeSubstring,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct SearchPage {
    pub data_generation_id: String,
    pub search_id: String,
    pub query: String,
    pub semantics: SearchSemantics,
    pub items: Vec<SearchHit>,
    pub has_more: bool,
    pub next_cursor: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct CancelSearchRequest {
    pub data_generation_id: String,
    pub search_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct CancelSearchResult {
    pub search_id: String,
    pub cancellation_requested: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AppearanceSaveRequest {
    pub data_generation_id: String,
    pub client_request_id: String,
    pub expected_revision: DecimalString,
    pub theme: Theme,
    pub reduce_motion: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ExitRequest {
    #[serde(default)]
    pub data_generation_id: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ExitReadyRequest {
    pub data_generation_id: String,
    pub request_id: String,
    pub ready: bool,
}

#[derive(Clone, Debug, Serialize, JsonSchema, TS)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
pub enum AppLifecyclePayload {
    ExitPrepare { request_id: String },
    ExitCancelled { request_id: String, error: AppError },
}

#[derive(Clone, Debug, Serialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AppLifecycleEvent {
    pub schema_version: SchemaVersion,
    pub data_generation_id: String,
    pub payload: AppLifecyclePayload,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ExitResult {
    pub shutting_down: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ModelProtocol {
    OpenaiChatCompletions,
    AnthropicMessages,
    OpenaiResponses,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ReasoningMode {
    Off,
    Enabled,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct ModelParameters {
    #[schemars(range(min = 0.0, max = 2.0))]
    pub temperature: f64,
    #[schemars(range(min = 0.0, max = 1.0))]
    pub top_p: f64,
    #[schemars(range(min = 1, max = 32768))]
    pub max_output_tokens: u32,
    #[schemars(range(min = 256, max = 128000))]
    pub input_budget: u32,
    pub reasoning: ReasoningMode,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct ModelProfileInput {
    pub id: String,
    #[schemars(length(min = 1, max = 80))]
    pub name: String,
    pub protocol: ModelProtocol,
    #[schemars(length(max = 2048))]
    pub base_url: String,
    #[schemars(length(max = 200))]
    pub model_name: String,
    pub parameters: ModelParameters,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct ModelProfile {
    pub id: String,
    pub name: String,
    pub protocol: ModelProtocol,
    pub base_url: String,
    pub model_name: String,
    pub parameters: ModelParameters,
    pub revision: DecimalString,
    pub credential_configured: bool,
}

impl ModelProfile {
    pub fn input(&self) -> ModelProfileInput {
        ModelProfileInput {
            id: self.id.clone(),
            name: self.name.clone(),
            protocol: self.protocol.clone(),
            base_url: self.base_url.clone(),
            model_name: self.model_name.clone(),
            parameters: self.parameters.clone(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct PersonaDimensions {
    #[schemars(range(max = 100))]
    pub professional: u8,
    #[schemars(range(max = 100))]
    pub formal: u8,
    #[schemars(range(max = 100))]
    pub casual: u8,
    #[schemars(range(max = 100))]
    pub humor: u8,
    #[schemars(range(max = 100))]
    pub direct: u8,
    #[schemars(range(max = 100))]
    pub empathy: u8,
    #[schemars(range(max = 100))]
    pub social_energy: u8,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct PersonaPreset {
    pub id: String,
    pub name: String,
    pub language_style: String,
    pub address_terms: Vec<String>,
    pub skill: String,
    pub dimensions: PersonaDimensions,
    pub revision: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct AgentPreferences {
    #[schemars(range(min = 1, max = 5000))]
    pub request_limit_daily: u32,
    pub persistent_memory: bool,
    pub allow_autonomous_wake: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct GlobalConfiguration {
    pub revision: DecimalString,
    pub model_profiles: Vec<ModelProfile>,
    pub persona_presets: Vec<PersonaPreset>,
    pub runtime_defaults: AgentPreferences,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct GlobalConfigurationGetRequest {
    pub data_generation_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct GlobalConfigurationSaveRequest {
    pub data_generation_id: String,
    pub client_request_id: String,
    pub expected_revision: DecimalString,
    pub model_profiles: Vec<ModelProfileInput>,
    pub persona_presets: Vec<PersonaPreset>,
    pub runtime_defaults: AgentPreferences,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct AgentModelSnapshot {
    pub source_profile_id: String,
    pub source_profile_revision: DecimalString,
    pub profile: ModelProfileInput,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    Social,
    Tool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct AgentConfiguration {
    pub agent_id: String,
    pub revision: DecimalString,
    pub display_name: String,
    pub introduction: String,
    pub gender_description: Option<String>,
    pub address_terms: Vec<String>,
    pub language_style: String,
    pub skill: String,
    pub dimensions: PersonaDimensions,
    pub avatar_id: Option<String>,
    pub agent_type: AgentType,
    pub model: Option<AgentModelSnapshot>,
    pub preferences: AgentPreferences,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AgentListRequest {
    pub data_generation_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AgentSaveRequest {
    pub data_generation_id: String,
    pub client_request_id: String,
    pub expected_revision: Option<DecimalString>,
    pub configuration: AgentConfiguration,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct UserProfile {
    pub participant_id: String,
    pub display_name: String,
    pub introduction: String,
    pub avatar_id: Option<String>,
    pub revision: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct UserProfileGetRequest {
    pub data_generation_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct UserProfileSaveRequest {
    pub data_generation_id: String,
    pub client_request_id: String,
    pub expected_revision: DecimalString,
    pub display_name: String,
    pub introduction: String,
    pub avatar_id: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct DevelopmentModelImportRequest {
    pub data_generation_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ModelProfileTestRequest {
    pub data_generation_id: String,
    pub profile_id: String,
    pub expected_revision: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct ModelTestResult {
    pub profile_id: String,
    pub revision: DecimalString,
    pub protocol: ModelProtocol,
    pub available: bool,
    pub usage_input_tokens: Option<u32>,
    pub usage_output_tokens: Option<u32>,
    pub elapsed_ms: u32,
}

#[derive(Clone, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct SecretSetRequest {
    pub data_generation_id: String,
    pub profile_id: String,
    pub expected_revision: DecimalString,
    pub api_key: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct SecretDeleteRequest {
    pub data_generation_id: String,
    pub profile_id: String,
    pub expected_revision: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct SecretStatusRequest {
    pub data_generation_id: String,
    pub profile_id: String,
    pub expected_revision: DecimalString,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct SecretStatus {
    pub profile_id: String,
    pub configured: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AvatarImportRequest {
    pub data_generation_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AvatarObject {
    pub id: String,
    pub mime_type: String,
    pub width: u32,
    pub height: u32,
    pub byte_size: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AvatarReadRequest {
    pub data_generation_id: String,
    pub avatar_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct AvatarData {
    pub avatar_id: String,
    pub mime_type: String,
    pub data_base64: String,
}
