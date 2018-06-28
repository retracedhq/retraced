insert into environmentuser (
  user_id, environment_id, email_token
) (
  select user_id, environment.id, md5(random()::text)
  from projectuser inner join environment
    on environment.project_id = projectuser.project_id
    inner join retraceduser
    on projectuser.user_id = retraceduser.id
) on conflict do nothing;
