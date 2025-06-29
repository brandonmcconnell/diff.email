CREATE TABLE IF NOT EXISTS browser_contexts (
    id TEXT PRIMARY KEY,
    client client NOT NULL,
    engine engine NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
); 