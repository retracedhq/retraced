import "source-map-support/register";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function listSavedExports(opts) {
  const pg = await pgPool.connect();
  try {
    let q = `select * from saved_export
      where project_id = $1 and environment_id = $2
      order by saved_at desc`;
    const v = [
      opts.project_id,
      opts.environment_id,
    ];

    if (opts.limit) {
      q = `${q} limit ${opts.limit}`;
    }

    const result = await pg.query(q, v);
    return result.rows;

  } finally {
    pg.release();
  }
}
