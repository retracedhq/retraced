-- SQL goes here
CREATE INDEX CONCURRENTLY cleanup_ingest_index ON ingest_task(project_id, environment_id, received);