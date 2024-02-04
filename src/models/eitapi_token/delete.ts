import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Opts {
  eitapiTokenId: string;
  projectId: string;
  environmentId: string;
  groupId: string;
}

/**
 * @returns true if the token was deleted
 */
export default async function deleteEitapiToken(opts): Promise<boolean> {
  const deleteStmt = `delete from eitapi_token where
      id = $1 and
      project_id = $2 and
      environment_id = $3 and
      group_id = $4`;
  const deleteVals = [opts.eitapiTokenId, opts.projectId, opts.environmentId, opts.groupId];

  const result = await pgPool.query(deleteStmt, deleteVals);

  return result.rowCount === 1;
}
