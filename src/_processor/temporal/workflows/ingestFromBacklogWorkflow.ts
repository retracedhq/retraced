import { ParentClosePolicy, proxyActivities, startChild } from "@temporalio/workflow";

import type * as activities from "../../workers";
import { normalizeEventWorkflow } from "./normalizeEventWorkflow";

const { ingestFromBacklog } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
  retry: {
    maximumAttempts: 1,
  },
});

export async function ingestFromBacklogWorkflow() {
  await ingestFromBacklog();

  // if (!tasks) {
  //   return;
  // }

  // await Promise.all(
  //   tasks.map((task) =>
  //     startChild(normalizeEventWorkflow, {
  //       args: [task.id],
  //       parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
  //     })
  //   )
  // );

  // Rewrite using for loop to avoid "Maximum call stack size exceeded" error
  // for (const task of tasks) {
  //   await startChild(normalizeEventWorkflow, {
  //     args: [task.id],
  //     parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
  //   });
  // }
}
