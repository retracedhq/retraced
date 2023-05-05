import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";
import type { Job } from "../../workers/normalizeEvent";

const { saveActiveGroup } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
  retry: {
    maximumAttempts: 3,
  },
});

export async function saveActiveGroupWorkflow(job: Job) {
  await saveActiveGroup(job);
}
