import "source-map-support/register";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function updateSavedExport(opts) {
  const pg = await pgPool.connect();
  try {
    const updatedSavedExport = {
      id: opts.id,
      version: opts.version,
      body: opts.body,
      project_id: opts.project_id,
      environment_id: opts.environment_id,
    };
    const updateStmt = `update saved_export
      set version = $1, body = $2
      where id = $3`;
    const updateVals = [
      updatedSavedExport.version,
      updatedSavedExport.body,
      updatedSavedExport.id,
    ];
    await pg.query(updateStmt, updateVals);

    return updatedSavedExport;

  } finally {
    pg.release();
  }
}
