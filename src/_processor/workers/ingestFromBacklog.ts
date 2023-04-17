import getPgPool from "../../persistence/pg";
import { logger } from "../../logger";
import getTemporalClient from "../persistence/temporal";
import { normalizeEventWorkflow } from "../temporal/workflows";
import { createWorkflowId } from "../temporal/helper";

const pgPool = getPgPool();

export default async function ingestFromBacklog() {
  try {
    const q = `
        WITH deleted AS (
            DELETE FROM backlog WHERE ctid IN (
                SELECT ctid FROM backlog LIMIT 1000
            )
            RETURNING
                new_event_id,
                project_id,
                environment_id,
                received,
                original_event
        )
        INSERT INTO ingest_task (
            id,
            new_event_id,
            project_id,
            environment_id,
            received,
            original_event
        ) SELECT md5(random()::text), * FROM deleted
        ON CONFLICT DO NOTHING
        RETURNING id`;

    const result = await pgPool.query<{ id: string }>(q, []);

    const temporalClient = await getTemporalClient();

    for (const row of result.rows) {
      await temporalClient.workflow.start(normalizeEventWorkflow, {
        workflowId: createWorkflowId(),
        taskQueue: "events",
        args: [row.id],
      });
    }
  } catch (ex) {
    logger.error("Error ingesting from backlog:", ex);
  }
}
