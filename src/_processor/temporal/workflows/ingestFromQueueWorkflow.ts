import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";
import type { Job } from "../../workers/ingestFromQueue";

const { ingestFromQueue, normalizeEvent } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
  retry: {
    maximumAttempts: 20,
  },
});

export async function ingestFromQueueWorkflow(job: Job) {
  const taskId = await ingestFromQueue(job);

  if (!taskId) {
    return;
  }

  await normalizeEvent(taskId);
}
