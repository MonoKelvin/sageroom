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

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, TS)]
#[serde(deny_unknown_fields)]
pub struct Participant {
    pub id: String,
    pub kind: ParticipantKind,
    pub display_name: String,
    pub introduction: String,
    pub status: ParticipantStatus,
    pub is_builtin: bool,
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
    pub app_version: String,
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
pub struct ExitResult {
    pub shutting_down: bool,
}
