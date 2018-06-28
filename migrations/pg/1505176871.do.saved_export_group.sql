-- SQL goes here
DELETE FROM saved_export;

ALTER TABLE saved_export ADD COLUMN group_id text NOT NULL;
