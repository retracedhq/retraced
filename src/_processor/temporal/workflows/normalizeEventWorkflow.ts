import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { normalizeEvent, saveActiveActor, saveActiveGroup, indexEvent, saveEventToElasticsearch } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "30 seconds",
    retry: {
      maximumAttempts: 1,
    },
  });

export async function normalizeEventWorkflow(taskId: string) {
  const normalizedEvent = await normalizeEvent(taskId);

  if (!normalizedEvent) {
    return;
  }

  await saveActiveActor(normalizedEvent);
  await saveActiveGroup(normalizedEvent);
  await indexEvent(normalizedEvent);
  await saveEventToElasticsearch(normalizedEvent);
}
