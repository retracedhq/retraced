-- SQL goes here

CREATE INDEX external_id_idx ON indexed_events USING GIN ((doc -> 'external_id') jsonb_path_ops);
