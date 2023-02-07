-- SQL goes here

CREATE TABLE IF NOT EXISTS analytics (
  name text not null primary key,
  uuid text not null,
  sent timestamp,
);