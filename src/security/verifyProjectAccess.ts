import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  projectId: string;
  userId: string;
}

export default async function (opts: Options): Promise<boolean> {
  const pg = await pgPool.connect();
  try {
    const q = "select count(1) from projectuser where user_id = $1 and project_id = $2";
    const result = await pg.query(q, [opts.userId, opts.projectId]);
    return result.rows[0].count > 0;
  } finally {
    pg.release();
  }
}
