import { proxyActivities, executeChild } from "@temporalio/workflow";

import type * as activities from "../../workers";
import { normalizeEventWorkflow } from "./normalizeEventWorkflow";
import { createWorkflowId } from "../helper";

const { ingestFromBacklog } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
  retry: {
    maximumAttempts: 1,
  },
});

export async function ingestFromBacklogWorkflow() {
  const tasks = await ingestFromBacklog();

  if (!tasks) {
    return;
  }

  await Promise.all(
    tasks.map((task) =>
      executeChild(normalizeEventWorkflow, {
        args: [task.id],
        workflowId: task.id,
      })
    )
  );
}
