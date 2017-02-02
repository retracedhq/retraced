import * as uuid from "uuid";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/*
opts:
  displayName
  projectId
  environmentId
  groupId
*/
export default async function createEatapiToken(opts) {
  const pg = await pgPool.connect();
  try {
    const newEatapiToken = {
      id: uuid.v4().replace(/-/g, ""),
      display_name: opts.displayName,
      project_id: opts.projectId,
      environment_id: opts.environmentId,
      group_id: opts.groupId,
    };
    const insertStmt = `insert into eatapi_token (
      id, display_name, project_id, environment_id, group_id
    ) values (
      $1, $2, $3, $4, $5
    )`;
    const insertVals = [
      newEatapiToken.id,
      newEatapiToken.display_name,
      newEatapiToken.project_id,
      newEatapiToken.environment_id,
      newEatapiToken.group_id,
    ];
    await pg.query(insertStmt, insertVals);

    return newEatapiToken;

  } finally {
    pg.release();
  }
}
