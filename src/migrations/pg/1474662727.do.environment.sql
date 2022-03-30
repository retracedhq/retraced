alter table project drop column environments;

drop type environment;

create table environment (
    id text not null primary key,
    name text,
    project_id text references project on delete cascade
);