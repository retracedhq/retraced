create table security_sink (
    id text not null primary key,
    environment_id text REFERENCES environment(id),
    project_id text REFERENCES project(id),
    group_id text,
    name text,
    config JSON,
    active BOOLEAN,
    created timestamp
);
