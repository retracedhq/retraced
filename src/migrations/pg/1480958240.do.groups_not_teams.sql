create table group_detail (
    created_at timestamp,
    project_id text not null,
    environment_id text not null,
    group_id text not null,
    name text not null,
    last_active timestamp,
    event_count bigint,
    primary key (environment_id, group_id)
);