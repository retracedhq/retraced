import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

interface Opts {
  user_id: string;
  timezone: string;
}

export default async function (opts: Opts): Promise<any> {
  // validate the timezone
  const tzQuery = `
    select count(1)
    from pg_timezone_names
    where name = $1`;
  const tzResult = await pgPool.query(tzQuery, [opts.timezone]);

  if (!tzResult.rows[0]) {
    throw new Error(
      `update user ${opts.user_id}: invalid timezone "${opts.timezone}"`
    );
  }

  const q = `
    update retraceduser
    set
      timezone = $1
    where
      id = $2
    returning *`;

  const v = [opts.timezone, opts.user_id];

  const result = await pgPool.query(q, v);

  if (result.rowCount > 0) {
    return result.rows[0];
  }

  return null;
}
