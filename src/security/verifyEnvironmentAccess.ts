import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  environmentId: string;
  userId: string;
}

export default async function verifyEnvironmentAccess(opts: Options): Promise<boolean> {
  const q = "select count(1) from environmentuser where user_id = $1 and environment_id = $2";
  const result = await pgPool.query(q, [opts.userId, opts.environmentId]);
  return result.rows[0].count > 0;
}
