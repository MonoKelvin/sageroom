CREATE TABLE app_meta (
    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
    root_id TEXT NOT NULL,
    schema_version INTEGER NOT NULL CHECK (schema_version = 5),
    schema_hash TEXT NOT NULL
);

CREATE TABLE participants (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('user', 'agent')),
    display_name TEXT NOT NULL,
    introduction TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'needs_configuration')),
    builtin_key TEXT UNIQUE,
    created_at INTEGER NOT NULL,
    avatar_id TEXT,
    profile_revision INTEGER NOT NULL DEFAULT 1 CHECK (profile_revision > 0)
);
CREATE UNIQUE INDEX single_local_user ON participants(kind) WHERE kind = 'user';

CREATE TABLE room (
    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
    id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    owner_participant_id TEXT NOT NULL REFERENCES participants(id),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    content_epoch INTEGER NOT NULL DEFAULT 0 CHECK (content_epoch >= 0)
);

CREATE TABLE messages (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT NOT NULL UNIQUE,
    room_id TEXT NOT NULL REFERENCES room(id),
    sender_id TEXT NOT NULL REFERENCES participants(id),
    created_at INTEGER NOT NULL,
    state TEXT NOT NULL DEFAULT 'visible' CHECK (state IN ('visible', 'recalled', 'deleted')),
    quote_message_id TEXT REFERENCES messages(id),
    mention_all INTEGER NOT NULL DEFAULT 0 CHECK (mention_all IN (0, 1))
);
CREATE INDEX messages_sender_seq ON messages(sender_id, seq);
CREATE INDEX messages_created_at ON messages(created_at, seq);

CREATE TABLE message_parts (
    message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    kind TEXT NOT NULL CHECK (kind = 'text'),
    text TEXT NOT NULL,
    PRIMARY KEY (message_id, ordinal)
);

CREATE TABLE mentions (
    message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    target_participant_id TEXT NOT NULL REFERENCES participants(id),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (message_id, target_participant_id)
);

CREATE TABLE search_text (
    seq INTEGER PRIMARY KEY REFERENCES messages(seq) ON DELETE CASCADE,
    text TEXT NOT NULL
);
CREATE VIRTUAL TABLE message_search USING fts5(text, content='search_text', content_rowid='seq', tokenize='trigram', detail=full);

CREATE TABLE app_settings (
    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
    theme TEXT NOT NULL CHECK (theme IN ('system', 'light', 'dark')),
    reduce_motion INTEGER NOT NULL CHECK (reduce_motion IN (0, 1)),
    revision INTEGER NOT NULL CHECK (revision > 0)
);

CREATE TABLE domain_events (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT NOT NULL UNIQUE,
    occurred_at INTEGER NOT NULL,
    payload_json TEXT NOT NULL
);

CREATE TABLE request_records (
    client_request_id TEXT PRIMARY KEY,
    operation TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    result_json TEXT NOT NULL
);

CREATE TABLE global_configuration (
    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
    revision INTEGER NOT NULL CHECK (revision > 0),
    preferences_json TEXT NOT NULL
);

CREATE TABLE model_profiles (
    id TEXT PRIMARY KEY,
    revision INTEGER NOT NULL CHECK (revision > 0),
    profile_json TEXT NOT NULL,
    credential_ref TEXT,
    credential_endpoint TEXT
);

CREATE TABLE model_profile_versions (
    profile_id TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK (revision > 0),
    profile_json TEXT NOT NULL,
    PRIMARY KEY (profile_id, revision)
);
CREATE TABLE credential_bindings (
    reference TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    protocol TEXT NOT NULL
);

CREATE TABLE persona_presets (
    id TEXT PRIMARY KEY,
    revision INTEGER NOT NULL CHECK (revision > 0),
    preset_json TEXT NOT NULL
);

CREATE TABLE agent_configurations (
    agent_id TEXT PRIMARY KEY REFERENCES participants(id),
    active_revision INTEGER NOT NULL CHECK (active_revision > 0)
);
CREATE TABLE agent_config_versions (
    agent_id TEXT NOT NULL REFERENCES participants(id),
    revision INTEGER NOT NULL CHECK (revision > 0),
    configuration_json TEXT NOT NULL,
    PRIMARY KEY (agent_id, revision)
);

CREATE TABLE avatar_objects (
    id TEXT PRIMARY KEY,
    relative_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL CHECK (mime_type = 'image/png'),
    width INTEGER NOT NULL CHECK (width > 0 AND width <= 512),
    height INTEGER NOT NULL CHECK (height > 0 AND height <= 512),
    byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 4194304),
    sha256 TEXT NOT NULL
);
CREATE TABLE avatar_refs (
    avatar_id TEXT NOT NULL REFERENCES avatar_objects(id),
    ref_kind TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    PRIMARY KEY (avatar_id, ref_kind, owner_id)
);

CREATE TABLE agent_runtime_states (
    agent_id TEXT PRIMARY KEY REFERENCES agent_configurations(agent_id),
    config_revision INTEGER NOT NULL CHECK (config_revision > 0),
    status TEXT NOT NULL CHECK (status IN ('needs_configuration', 'observing', 'deciding', 'waiting_to_send', 'sleeping', 'paused', 'protected', 'offline')),
    detail TEXT,
    next_wake_at INTEGER
);

CREATE TABLE runtime_request_counts (
    requester_id TEXT NOT NULL,
    utc_day INTEGER NOT NULL,
    requests INTEGER NOT NULL CHECK (requests > 0),
    PRIMARY KEY (requester_id, utc_day)
);
CREATE INDEX runtime_request_counts_day ON runtime_request_counts(utc_day);

CREATE TABLE runtime_plans (
    agent_id TEXT PRIMARY KEY REFERENCES agent_configurations(agent_id),
    config_revision INTEGER NOT NULL CHECK (config_revision > 0),
    next_wake_at INTEGER NOT NULL,
    chain_id TEXT NOT NULL
);

CREATE TABLE runtime_wake_log (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL REFERENCES agent_configurations(agent_id),
    reserved_at INTEGER NOT NULL
);
CREATE INDEX runtime_wake_log_agent_time ON runtime_wake_log(agent_id, reserved_at);

CREATE TABLE runtime_message_activity (
    message_seq INTEGER PRIMARY KEY CHECK (message_seq > 0),
    message_id TEXT NOT NULL UNIQUE,
    sender_id TEXT NOT NULL REFERENCES participants(id),
    decision_id TEXT
);

CREATE TABLE runtime_messages (
    decision_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    agent_id TEXT NOT NULL REFERENCES agent_configurations(agent_id),
    config_revision INTEGER NOT NULL CHECK (config_revision > 0),
    observed_through_seq INTEGER NOT NULL CHECK (observed_through_seq >= 0),
    chain_id TEXT NOT NULL,
    message_id TEXT NOT NULL UNIQUE,
    message_seq INTEGER NOT NULL UNIQUE CHECK (message_seq > 0),
    event_seq INTEGER NOT NULL CHECK (event_seq > 0),
    committed_at INTEGER NOT NULL,
    payload_hash TEXT NOT NULL,
    PRIMARY KEY (decision_id, ordinal)
);
CREATE INDEX runtime_messages_chain ON runtime_messages(chain_id);
CREATE INDEX runtime_messages_time ON runtime_messages(committed_at);

PRAGMA user_version = 5;
