create table saved_export (
    id text not null primary key,
    name text not null,
    version int not null default 1,
    saved_at timestamp not null default current_timestamp,
    body text not null,
    project_id text not null,
    environment_id text not null
);
