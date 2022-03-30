create table display_template (
	id text not null,
	created_at timestamp without time zone,
    updated_at timestamp without time zone,
    project_id text not null references project(id) on delete cascade,
    environment_id text not null references environment(id) on delete cascade,
    name text not null,
    rule text not null,
    template text not null,
	primary key (id)
);
