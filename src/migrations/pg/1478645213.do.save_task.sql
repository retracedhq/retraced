create table ingest_task (
    id text not null primary key,
    disque_job_id text not null,
    original_event text not null,
    normalized_event text not null,
    saved_to_dynamo boolean not null default false,
    saved_to_postgres boolean not null default false,
    saved_to_elasticsearch boolean not null default false,
    saved_to_scylla boolean not null default false
);
