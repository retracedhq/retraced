import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

// opts: email, authId
// TODO(zhaytee): Conform this to the RetracedUser interface
export default async function (opts) {
  const q = "select * from retraceduser where email = $1 and external_auth_id = $2";
  const v = [opts.email, opts.authId];
  const result = await pgPool.query(q, v);
  if (result.rowCount) {
    return result.rows[0];
  }

  return null;
}
