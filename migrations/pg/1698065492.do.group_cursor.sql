create table group_cursor (
    id text not null primary key,
    environment_id text REFERENCES environment(id),
    project_id text REFERENCES project(id),
    group_id text,
    previous_cursor text,
    cursor text
);
