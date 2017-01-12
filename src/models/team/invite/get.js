import getPgPool from "../../../persistence/pg";

const pgPool = getPgPool();

export default async function getInvite(opts) {
  let pg;
  try {
    pg = await pgPool.connect();

    let q;
    let v;
    if (opts.inviteId) {
      q = "select * from invite where id = $1";
      v = [opts.inviteId];
    } else if (opts.email) {
      q = "select * from invite where email = $1";
      v = [opts.email];
    }

    const result = await pg.query(q, v);
    if (result.rowCount > 0) {
      return result.rows[0];
    }

    return null;

  } finally {
    pg.release();
  }
}
