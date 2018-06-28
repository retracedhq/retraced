-- SQL goes here
CREATE TABLE backlog (
	new_event_id text,
	project_id text,
	environment_id text,
	received timestamp,
	original_event text
);

CREATE UNIQUE INDEX new_event_id_idx ON ingest_task (new_event_id);
