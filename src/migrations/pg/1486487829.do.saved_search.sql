create table saved_search (
    id text primary key not null,
    name text not null,
    project_id text not null,
    environment_id text not null,
    group_id text not null,
    query_desc text not null
);
