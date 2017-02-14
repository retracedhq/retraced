import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/*
  opts:
    projectId
    environmentId
    groupId
*/
export default async function listEitapiTokens(opts) {
  const pg = await pgPool.connect();
  try {
    let q = `select id, display_name from eitapi_token
      where project_id = $1 and environment_id = $2 and group_id = $3`;
    const v = [
      opts.projectId,
      opts.environmentId,
      opts.groupId,
    ];

    const result = await pg.query(q, v);
    return result.rows;

  } finally {
    pg.release();
  }
}
