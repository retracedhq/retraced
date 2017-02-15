import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function getSavedExports(opts) {
  const pg = await pgPool.connect();
  try {
    let q = "select * from saved_export where id = $1";
    const v = [opts.id];
    const result = await pg.query(q, v);
    if (result.rows.length > 0) {
        return result.rows[0];
    }
    return null;

  } finally {
    pg.release();
  }
}
