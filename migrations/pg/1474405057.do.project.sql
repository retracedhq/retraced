create type environment as (
    id text,
    name text
); 

create table project (
    id text not null primary key,
    created timestamp,
    environments environment[],
    name text
);
