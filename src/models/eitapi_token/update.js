import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/*
opts:
  eitapiTokenId
  projectId
  environmentId
  groupId

  displayName
  viewLogAction?
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
      view_log_action: opts.viewLogAction,
    };
    const updateStmt = `update eitapi_token
      set
        display_name = $5,
        view_log_action = COALESCE($6, eitapi_token.view_log_action)
      where id = $1 and
        project_id = $2 and
        environment_id = $3 and
        group_id = $4
      returning view_log_action`;
    const updateVals = [
      updatedEitapiToken.id,
      updatedEitapiToken.project_id,
      updatedEitapiToken.environment_id,
      updatedEitapiToken.group_id,
      updatedEitapiToken.display_name,
      updatedEitapiToken.view_log_action,
    ];
    const result = await pg.query(updateStmt, updateVals);
    if (result.rowCount !== 1) {
      throw new Error(`Expected updated row count of 1, got ${result.rowCount}`);
    }
    updatedEitapiToken.view_log_action = result.rows.view_log_action;

    return updatedEitapiToken;
  } finally {
    pg.release();
  }
}
