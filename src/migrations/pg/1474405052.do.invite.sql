create table invite (
    id text not null primary key,
    created timestamp,
    email text,
    project_id text
);
