import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/*
opts:
  eatapiTokenId
  projectId
  environmentId
  groupId  
*/
export default async function deleteEatapiToken(opts) {
  const pg = await pgPool.connect();
  try {
    const deleteStmt = `delete from eatapi_token where
      id = $1 and
      project_id = $2 and
      environment_id = $3 and
      group_id = $4`;
    const deleteVals = [
      opts.eatapiTokenId,
      opts.projectId,
      opts.environmentId,
      opts.groupId,
    ];
    const result = await pg.query(deleteStmt, deleteVals);
    if (result.rowCount !== 1) {
      throw new Error(`Expected deleted row count of 1, got ${result.rowCount}`);
    }

  } finally {
    pg.release();
  }
}
