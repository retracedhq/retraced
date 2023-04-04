import { proxyActivities, executeChild } from "@temporalio/workflow";

import type * as activities from "../../workers";
import { normalizeEventWorkflow } from "./normalizeEventWorkflow";

const { normalizeRepair } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function normalizeRepairWorkflow() {
  const taskIds: string[] = await normalizeRepair();

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
