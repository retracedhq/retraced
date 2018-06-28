-- SQL goes here

CREATE TABLE IF NOT EXISTS admin_token (
  id text not null primary key,
  token_bcrypt text not null,
  user_id text not null,

  disabled boolean not null default false,
  created timestamp not null default current_timestamp,
  last_used timestamp
);