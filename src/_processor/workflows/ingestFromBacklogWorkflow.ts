import { proxyActivities, executeChild } from "@temporalio/workflow";

import type * as activities from "../activities";
import { normalizeEventWorkflow } from "./normalizeEventWorkflow";

const { ingestFromBacklog } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function ingestFromBacklogWorkflow(): Promise<void> {
  const taskIds = await ingestFromBacklog();

  if (!taskIds) {
    return;
  }

  await Promise.all(
    taskIds.map((taskId) =>
      executeChild(normalizeEventWorkflow, {
        args: [taskId],
      })
    )
  );
}
