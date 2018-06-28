create table active_actor (
    created_at timestamptz not null,
    project_id text not null,
    environment_id text not null,
    actor_id text not null
);

create table active_group (
    created_at timestamptz not null,
    project_id text not null,
    environment_id text not null,
    group_id text not null
);
