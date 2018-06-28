create table active_search (
    id text primary key not null,
    project_id text not null,
    environment_id text not null,
    group_id text not null,
    saved_search_id text not null references saved_search(id),
    next_token text,
    next_start_time bigint
);
