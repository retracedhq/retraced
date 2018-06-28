-- SQL goes here
alter table eitapi_token add column view_log_action text not null default 'audit.log.view';
alter table group_detail alter column name drop not null;
