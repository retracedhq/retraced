-- SQL goes here
CREATE TABLE viewer_descriptors (
	id text PRIMARY KEY,
	project_id text NOT NULL,
	environment_id text NOT NULL,
	group_id text NOT NULL,
	created timestamp NOT NULL,
	is_admin boolean,
	view_log_action text,
	actor_id text,
	scope text
);
