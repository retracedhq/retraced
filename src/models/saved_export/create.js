import * as uuid from "uuid";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function createSavedExport(opts) {
  const pg = await pgPool.connect();
  try {
    const newSavedExport = {
      id: uuid.v4().replace(/-/g, ""),
      version: opts.version || 1,
      body: opts.body,
      name: opts.name,
      project_id: opts.projectId,
      environment_id: opts.environmentId,
    };
    const insertStmt = `insert into saved_export (
      id, name, version, body, project_id, environment_id
    ) values (
      $1, $2, $3, $4, $5, $6
    )`;
    const insertVals = [
      newSavedExport.id,
      newSavedExport.name,
      newSavedExport.version,
      newSavedExport.body,
      newSavedExport.project_id,
      newSavedExport.environment_id,
    ];
    await pg.query(insertStmt, insertVals);

    return newSavedExport;

  } finally {
    pg.release();
  }
}
