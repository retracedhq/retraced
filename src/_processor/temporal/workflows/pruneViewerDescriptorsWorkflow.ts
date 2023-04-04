import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { pruneViewerDescriptors } = proxyActivities<typeof activities>({
  startToCloseTimeout: "60 seconds",
  retry: {
    maximumAttempts: 1,
  },
});

export async function pruneViewerDescriptorsWorkflow(): Promise<void> {
  await pruneViewerDescriptors();
}
