import * as uuid from "uuid";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/*
opts:
  eitapiTokenId
  projectId
  environmentId
  groupId

  displayName
*/
export default async function updateEitapiToken(opts) {
  const pg = await pgPool.connect();
  try {
    const updatedEitapiToken = {
      id: opts.eitapiTokenId,
      project_id: opts.projectId,
      environment_id: opts.environmentId,
      group_id: opts.groupId,
      display_name: opts.displayName,
    };
    const updateStmt = `update eitapi_token
      set display_name = $5
      where id = $1 and
        project_id = $2 and
        environment_id = $3 and
        group_id = $4`;
    const updateVals = [
      updatedEitapiToken.id,
      updatedEitapiToken.project_id,
      updatedEitapiToken.environment_id,
      updatedEitapiToken.group_id,
      updatedEitapiToken.display_name,
    ];
    const result = await pg.query(updateStmt, updateVals);
    if (result.rowCount !== 1) {
      throw new Error(`Expected updated row count of 1, got ${result.rowCount}`);
    }

    return updatedEitapiToken;

  } finally {
    pg.release();
  }
}
