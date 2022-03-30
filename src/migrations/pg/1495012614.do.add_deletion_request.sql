create table deletion_request (
    id text not null primary key,
    created timestamp without time zone not null,
    backoff_interval bigint,
    resource_kind text not null,
    resource_id text not null
);

create table deletion_confirmation (
    id text not null primary key,
    deletion_request_id text not null
        references deletion_request(id) on delete cascade,
    retraceduser_id text not null
        references retraceduser(id) on delete cascade,
    received timestamp without time zone,
    visible_code text not null
);
