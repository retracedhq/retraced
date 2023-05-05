import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { normalizeEvent } = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 seconds",
  retry: {
    maximumAttempts: 1,
  },
});

export async function normalizeEventWorkflow(taskId: string) {
  await normalizeEvent(taskId);
}
