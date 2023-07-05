-- SQL goes here
CREATE TABLE IF NOT EXISTS backlog (
	new_event_id text,
	project_id text,
	environment_id text,
	received timestamp,
	original_event text
);

CREATE UNIQUE INDEX IF NOT EXISTS new_event_id_idx ON ingest_task (new_event_id);
