import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { ingestFromQueue, normalizeEvent } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function ingestFromQueueWorkflow(job: string): Promise<void> {
  const taskId = await ingestFromQueue(job);

  if (!taskId) {
    return;
  }

  await normalizeEvent(taskId);
}
