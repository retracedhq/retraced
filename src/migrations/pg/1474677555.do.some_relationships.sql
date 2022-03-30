alter table token add foreign key (environment_id) references environment on delete cascade;

alter table token add foreign key (project_id) references project on delete cascade;
