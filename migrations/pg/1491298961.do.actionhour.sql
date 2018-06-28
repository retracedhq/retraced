create table actionhour (
	action_id text not null references action(id) on delete cascade,
	hour timestamp not null,
	count integer not null,
	primary key (action_id, hour)
);

alter table environmentuser
	add column anomaly_report boolean not null default true;
