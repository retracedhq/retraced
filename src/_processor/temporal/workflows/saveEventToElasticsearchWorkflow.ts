import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";
import type { Job } from "../../workers/normalizeEvent";

const { saveEventToElasticsearch } = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 seconds",
  retry: {
    maximumAttempts: 3,
  },
});

export async function saveEventToElasticsearchWorkflow(job: Job) {
  await saveEventToElasticsearch(job);
}
