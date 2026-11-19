CREATE TABLE app_meta (
    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
    root_id TEXT NOT NULL,
    schema_version INTEGER NOT NULL CHECK (schema_version = 1),
    migration_hash TEXT NOT NULL
);

CREATE TABLE participants (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('user', 'agent')),
    display_name TEXT NOT NULL,
    introduction TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'needs_configuration')),
    builtin_key TEXT UNIQUE,
    created_at INTEGER NOT NULL
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
    sender_snapshot_json TEXT NOT NULL,
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

PRAGMA user_version = 1;
