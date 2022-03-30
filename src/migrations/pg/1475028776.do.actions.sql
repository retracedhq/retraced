create table action (
    id text not null primary key,
    created timestamp,
    environment_id text,
    event_count bigint default 1,
    first_active timestamp,
    action text,
    last_active timestamp,
    project_id text,
    display_template text default null,
    constraint environment_action unique (environment_id, action) 
);
