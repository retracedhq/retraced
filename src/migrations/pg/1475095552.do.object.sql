create table object (
    id text not null primary key,
    created timestamp,
    environment_id text,
    event_count bigint default 0,
    first_active timestamp,
    foreign_id text,
    last_active timestamp,
    name text,
    project_id text,
    url text,
    type text
);
