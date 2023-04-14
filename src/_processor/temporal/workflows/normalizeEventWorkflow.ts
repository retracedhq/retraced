import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { normalizeEvent, saveActiveActor, saveActiveGroup, indexEventToDataStore } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: "70 seconds",
  retry: {
    maximumAttempts: 1,
  },
});

export async function normalizeEventWorkflow(taskId: string) {
  const normalizedEvent = await normalizeEvent(taskId);

  if (!normalizedEvent) {
    return;
  }

  await Promise.all([
    saveActiveActor(normalizedEvent),
    saveActiveGroup(normalizedEvent),
    indexEventToDataStore(normalizedEvent),
  ]);
}
