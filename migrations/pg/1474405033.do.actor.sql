create table actor (
    id text not null primary key,
    created timestamp,
    environment_id text,
    event_count bigint,
    first_active timestamp,
    foreign_id text,
    last_active timestamp,
    name text,
    project_id text
);
