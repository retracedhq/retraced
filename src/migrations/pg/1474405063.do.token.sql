create table token (
    token text not null primary key,
    created timestamp,
    disabled boolean,
    environment_id text,
    name text,
    project_id text
);