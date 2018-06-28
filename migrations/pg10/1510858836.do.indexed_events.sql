-- SQL goes here
CREATE TABLE indexed_events (
	id text PRIMARY KEY,
	project_id text NOT NULL,
	environment_id text NOT NULL,
	doc jsonb NOT NULL
);

CREATE INDEX indexed_proj_env_idx ON indexed_events (project_id, environment_id);

-- GIN jsonb_path_ops for equality queries
CREATE INDEX crud_idx ON indexed_events USING GIN ((doc -> 'crud') jsonb_path_ops);
CREATE INDEX group_id_idx ON indexed_events USING GIN ((doc -> 'group' -> 'id') jsonb_path_ops);
CREATE INDEX actor_id_idx ON indexed_events USING GIN ((doc -> 'actor' -> 'id') jsonb_path_ops);

-- action must support prefix searches with LIKE
CREATE INDEX action_idx ON indexed_events USING BTREE (((doc -> 'action')::text));

-- btrees for inequality queries
CREATE INDEX canonical_time_idx ON indexed_events USING BTREE (((doc -> 'canonical_time')::text::bigint));
CREATE INDEX received_idx ON indexed_events USING BTREE (((doc -> 'received')::text::bigint));
CREATE INDEX created_idx ON indexed_events USING BTREE (((doc -> 'created')::text::bigint));

-- expression indexes used for matching (@@) tsquery types
CREATE INDEX actor_name_idx ON indexed_events USING GIN (to_tsvector('english', (doc -> 'actor' -> 'name')));
CREATE INDEX description_idx ON indexed_events USING GIN (to_tsvector('english', (doc -> 'description')));

-- free text search
CREATE INDEX free_text_idx ON indexed_events USING GIN (to_tsvector('english', doc));
