alter table retraceduser
	add column timezone text not null default 'US/Pacific',
	add column tx_emails_recipient boolean not null default true;

create table environmentuser (
	user_id text not null references retraceduser on delete cascade,
	environment_id text not null references environment on delete cascade,
	daily_report boolean not null default true,
	email_token text not null,
	primary key (user_id, environment_id)
);
