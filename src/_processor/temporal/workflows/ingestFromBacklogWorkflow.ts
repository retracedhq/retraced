import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { ingestFromBacklog } = proxyActivities<typeof activities>({
  startToCloseTimeout: "25 seconds",
  retry: {
    maximumAttempts: 1,
  },
});

export async function ingestFromBacklogWorkflow() {
  await ingestFromBacklog();
}
