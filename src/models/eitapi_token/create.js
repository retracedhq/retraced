import "source-map-support/register";
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
export default async function createEitapiToken(opts) {
  const pg = await pgPool.connect();
  try {
    const newEitapiToken = {
      id: uuid.v4().replace(/-/g, ""),
      display_name: opts.displayName,
      project_id: opts.projectId,
      environment_id: opts.environmentId,
      group_id: opts.groupId,
    };
    const insertStmt = `insert into eitapi_token (
      id, display_name, project_id, environment_id, group_id
    ) values (
      $1, $2, $3, $4, $5
    )`;
    const insertVals = [
      newEitapiToken.id,
      newEitapiToken.display_name,
      newEitapiToken.project_id,
      newEitapiToken.environment_id,
      newEitapiToken.group_id,
    ];
    await pg.query(insertStmt, insertVals);

    return newEitapiToken;

  } finally {
    pg.release();
  }
}
