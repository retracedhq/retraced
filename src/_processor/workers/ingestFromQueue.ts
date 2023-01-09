import * as uuid from "uuid";
import getPgPool from "../persistence/pg";
import nsq from "../persistence/nsq";

const pgPool = getPgPool();

export interface Task {
  new_event_id: string;
  project_id: string;
  environment_id: string;
  received: number;
  original_event: string;
}

export default async function ingestFromQueue(job: any) {
  const task: Task = JSON.parse(job.body);
  const taskId = uuid.v4().replace(/-/g, "");
  const q = `
        INSERT INTO ingest_task (
            id,
            new_event_id,
            project_id,
            environment_id,
            received,
            original_event
        ) VALUES (
            $1,
            $2,
            $3,
            $4,
            to_timestamp($5::double precision / 1000),
            $6
        ) ON CONFLICT DO NOTHING
        RETURNING id`;

  try {
    const results = await pgPool.query(q, [
      taskId,
      task.new_event_id,
      task.project_id,
      task.environment_id,
      task.received,
      JSON.stringify(task.original_event),
    ]);
    if (results.rows.length === 0) {
      // conflict, already ingested
      return;
    }
  } catch (err) {
    err.retry = true;
    throw err;
  }

  const jobTask = JSON.stringify({
    taskId,
  });
  await nsq.produce("raw_events", jobTask);
}
