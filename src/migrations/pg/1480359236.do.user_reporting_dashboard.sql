create table reporting_event (
    created_at timestamptz not null,
    project_id text not null,
    environment_id text not null,
    event_name text not null
);
