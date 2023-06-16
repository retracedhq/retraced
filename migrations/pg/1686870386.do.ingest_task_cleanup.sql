-- SQL goes here

ALTER TABLE ingest_task DROP COLUMN saved_to_dynamo, DROP COLUMN saved_to_postgres, DROP COLUMN saved_to_elasticsearch, DROP COLUMN saved_to_scylla;
