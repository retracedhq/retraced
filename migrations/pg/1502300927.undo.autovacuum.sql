-- SQL goes here
-- restore defaults
ALTER TABLE ingest_task SET (
	autovacuum_vacuum_scale_factor = 0.2,
	autovacuum_vacuum_threshhold = 50,
	autovacuum_analyze_scale_factor = 0.2,
	autovacuum_analyze_threshhold = 50
);
