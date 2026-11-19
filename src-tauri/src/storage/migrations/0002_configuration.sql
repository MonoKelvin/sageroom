ALTER TABLE app_meta RENAME TO app_meta_v1;
CREATE TABLE app_meta (
    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
    root_id TEXT NOT NULL,
    schema_version INTEGER NOT NULL CHECK (schema_version IN (1, 2)),
    migration_hash TEXT NOT NULL
);
INSERT INTO app_meta SELECT singleton, root_id, 2, migration_hash FROM app_meta_v1;
DROP TABLE app_meta_v1;

ALTER TABLE participants ADD COLUMN avatar_id TEXT;
ALTER TABLE participants ADD COLUMN profile_revision INTEGER NOT NULL DEFAULT 1 CHECK (profile_revision > 0);

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

PRAGMA user_version = 2;
