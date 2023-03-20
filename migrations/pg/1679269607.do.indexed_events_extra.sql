-- SQL goes here

CREATE INDEX external_id_idx ON indexed_events USING GIN ((doc -> 'external_id') jsonb_path_ops);
CREATE INDEX fields_idx ON indexed_events USING GIN (to_tsvector('english', (doc -> 'fields')));

-- remove free text search
-- DROP INDEX IF EXISTS free_text_idx
