alter table ingest_task
drop column disque_job_id,
alter column normalized_event drop not null,
add column project_id text,
add column environment_id text;
