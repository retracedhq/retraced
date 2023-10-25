create table vectorsink (
    id text not null primary key,
    created timestamp,
    environment_id text REFERENCES environment(id),
    project_id text REFERENCES project(id),
    group_id text REFERENCES group(id),
    name text,
    config JSON,
    active BOOLEAN
);
