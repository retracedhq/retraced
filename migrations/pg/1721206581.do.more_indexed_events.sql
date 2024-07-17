-- SQL goes here
-- GIN jsonb_path_ops for equality queries
CREATE INDEX target_id_idx ON indexed_events USING GIN ((doc -> 'target' -> 'id') jsonb_path_ops);

-- expression indexes used for matching (@@) tsquery types
CREATE INDEX target_name_idx ON indexed_events USING GIN (to_tsvector('english', (doc -> 'target' -> 'name')));
CREATE INDEX target_type_idx ON indexed_events USING GIN (to_tsvector('english', (doc -> 'target' -> 'type')));
