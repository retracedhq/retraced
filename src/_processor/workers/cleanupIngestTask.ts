import { logger } from "../logger";
import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export default async function cleanupIngestTask(job: any) {
  const { projectId, environemntId, beforeTimestamp, batchSize = 1000 } = job;
  // Delete from ingest_tasks
  const query = `SELECT COUNT(*) FROM ingest_task WHERE project_id = $1 AND environment_id = $2 AND received < $3`;
  const events = await pgPool.query(query, [projectId, environemntId, new Date(beforeTimestamp)]);
  logger.info(`Got events ingest_tasks: ${events.rows[0].count}`);
  backupAndDeleteIngestTasks(projectId, environemntId, beforeTimestamp, batchSize);
  return events.rows[0].count;
}

export async function backupAndDeleteIngestTasks(
  projectId,
  environemntId,
  beforeTimestamp,
  batchSize = 1000
) {
  // Delete from ingest_tasks by batch
  let i = 0;
  do {
    const query = `SELECT * FROM ingest_task WHERE project_id = $1 AND environment_id = $2 AND received < $3 LIMIT $4 OFFSET $5`;
    const events = await pgPool.query(query, [
      projectId,
      environemntId,
      new Date(beforeTimestamp),
      batchSize,
      i * batchSize,
    ]);
    if (events.rowCount === 0) {
      break;
    }
    const batch = events.rows;
    const ids = batch.map((row) => row.id);
    const q = `DELETE FROM ingest_task WHERE id = ANY($1)`;
    const values = [ids];
    const backedup = backupIngestTaskBatch(batch);
    if (backedup === ids.length) {
      const res = await pgPool.query(q, values);
      logger.info(`Old events deleted from ingest_tasks: ${res.rowCount}`);
    }
    i++;
  } while (true);
  return;
}

export function backupIngestTaskBatch(batch: any[]) {
  // Backup to s3
  // const s3 = new S3();
  // const params = {
  //   Bucket: "retraced-ingest-tasks",
  //   Key: `ingest_tasks_${new Date().toISOString()}.json`,
  //   Body: JSON.stringify(batch),
  // };
  // const res = await s3.putObject(params).promise();
  // logger.info(`Backup to s3: ${res}`);
  return batch.length;
}
