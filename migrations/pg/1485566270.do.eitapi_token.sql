create table eitapi_token (
    id text primary key not null,
    display_name text,
    project_id text not null,
    environment_id text not null,
    group_id text not null
);
