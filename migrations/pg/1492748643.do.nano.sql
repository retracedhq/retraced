CREATE FUNCTION fixMicroTimestamps() RETURNS void AS $$
BEGIN
	UPDATE group_detail
	SET created_at = to_timestamp(extract(epoch from created_at) / 1000)
	WHERE created_at > timestamp '3000-01-01';

	UPDATE group_detail
	SET last_active = to_timestamp(extract(epoch from last_active) / 1000)
	WHERE last_active > timestamp '3000-01-01';

	UPDATE project
	SET created = to_timestamp(extract(epoch from created) / 1000)
	WHERE created > timestamp '3000-01-01';

	UPDATE reporting_event
	SET created_at = to_timestamp(extract(epoch from created_at) / 1000)
	WHERE created_at > timestamp '3000-01-01';

	UPDATE retraceduser
	SET created = to_timestamp(extract(epoch from created) / 1000)
	WHERE created > timestamp '3000-01-01';

	UPDATE retraceduser
	SET last_login = to_timestamp(extract(epoch from last_login) / 1000)
	WHERE last_login > timestamp '3000-01-01';

	UPDATE token
	SET created = to_timestamp(extract(epoch from created) / 1000)
	WHERE created > timestamp '3000-01-01';
END;
$$ LANGUAGE plpgsql;
