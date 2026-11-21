ALTER TABLE app_meta RENAME TO app_meta_v2;
CREATE TABLE app_meta (
    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
    root_id TEXT NOT NULL,
    schema_version INTEGER NOT NULL CHECK (schema_version IN (1, 2, 3)),
    migration_hash TEXT NOT NULL
);
INSERT INTO app_meta SELECT singleton, root_id, 3, migration_hash FROM app_meta_v2;
DROP TABLE app_meta_v2;

CREATE TABLE agent_runtime (
    agent_id TEXT PRIMARY KEY REFERENCES participants(id),
    config_revision INTEGER NOT NULL CHECK (config_revision > 0),
    state_json TEXT NOT NULL,
    paused INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0, 1))
);

CREATE TABLE runtime_plans (
    agent_id TEXT PRIMARY KEY REFERENCES participants(id),
    config_revision INTEGER NOT NULL CHECK (config_revision > 0),
    next_wake_at INTEGER NOT NULL,
    chain_id TEXT NOT NULL
);

CREATE TABLE runtime_requests (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id TEXT NOT NULL,
    occurred_at INTEGER NOT NULL
);
CREATE INDEX runtime_requests_requester_time ON runtime_requests(requester_id, occurred_at);

CREATE TABLE runtime_wakes (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL REFERENCES participants(id),
    occurred_at INTEGER NOT NULL
);
CREATE INDEX runtime_wakes_agent_time ON runtime_wakes(agent_id, occurred_at);

CREATE TABLE runtime_message_commits (
    decision_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    agent_id TEXT NOT NULL REFERENCES participants(id),
    config_revision INTEGER NOT NULL,
    observed_through_seq INTEGER NOT NULL,
    chain_id TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    message_seq INTEGER NOT NULL UNIQUE REFERENCES messages(seq),
    event_seq INTEGER NOT NULL,
    PRIMARY KEY (decision_id, ordinal)
);
CREATE INDEX runtime_message_commits_chain ON runtime_message_commits(chain_id);
CREATE INDEX runtime_message_commits_agent_seq ON runtime_message_commits(agent_id, message_seq);

PRAGMA user_version = 3;
