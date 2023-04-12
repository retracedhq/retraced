import config from "../../config";
import { logger } from "../logger";
import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export default async function cleanupPostgres(job: any) {
  const { projectId, environemntId, beforeTimestamp } = job;
  // Delete from indexed_events
  if (config.PG_SEARCH) {
    const q = `
    DELETE FROM indexed_events
      WHERE 
        project_id = $1 AND
        environment_id = $2 AND
        to_timestamp(CAST(doc->>'received' AS BIGINT) / 1000) < $3`;
    const values = [projectId, environemntId, new Date(beforeTimestamp)];
    const result = await pgPool.query(q, values);
    logger.info(`Old events deleted from indexed_events: ${result.rowCount}`);
  }
  // Delete from ingest_tasks
  const q = `DELETE FROM ingest_task WHERE project_id = $1 AND environment_id = $2 AND received < $3`;
  const values = [projectId, environemntId, new Date(beforeTimestamp)];
  const result = await pgPool.query(q, values);
  logger.info(`Old events deleted from ingest_tasks: ${result.rowCount}`);
}
