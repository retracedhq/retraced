-- SQL goes here
CREATE INDEX normalizer_repairer_index ON ingest_task(received, id) WHERE normalized_event IS NULL;
