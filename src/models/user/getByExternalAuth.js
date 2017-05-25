import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

// opts: email, authId
// TODO(zhaytee): Conform this to the RetracedUser interface
export default async function(opts) {
  let pg;
  try {
    pg = await pgPool.connect();
    const q = "select * from retraceduser where email = $1 and external_auth_id = $2";
    const v = [opts.email, opts.authId];
    const result = await pg.query(q, v);
    if (result.rowCount > 0) {
      return result.rows[0];
    }

    return null;
  } finally {
    pg.release();
  }
}
