import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/*
  opts:
    eitapiTokenId
*/
export default async function getEitapiToken(opts) {
  const pg = await pgPool.connect();
  try {
    let q = `
    select
      id, display_name, project_id, environment_id, group_id
    from
      eitapi_token
    where
      id = $1
    `;
    const result = await pg.query(q, [opts.eitapiTokenId]);
    if (result.rowCount === 1) {
      return result.rows[0];
    } else if (result.rowCount > 1) {
      throw new Error(`Expected row count of 1, got ${result.rowCount}`);
    }
    return null;

  } finally {
    pg.release();
  }
}
