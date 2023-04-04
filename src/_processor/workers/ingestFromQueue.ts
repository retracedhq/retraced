import * as uuid from "uuid";

import type { CreateEventRequest } from "../../handlers/createEvent";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function ingestFromQueue(task: Job) {
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
      return;
    }
  } catch (err) {
    err.retry = true;
    throw err;
  }

  return taskId;
}

export interface Job {
  project_id: string;
  environment_id: string;
  new_event_id: string;
  original_event: CreateEventRequest;
  received: number;
}
