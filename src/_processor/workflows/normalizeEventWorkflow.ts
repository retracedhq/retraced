import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../activities";

const { normalizeEvent, saveActiveActor, saveActiveGroup, indexEvent, saveEventToElasticsearch } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "1 minute",
  });

export async function normalizeEventWorkflow(taskId: string): Promise<void> {
  const normalizedEvent = await normalizeEvent(taskId);

  if (!normalizedEvent) {
    return;
  }

  await saveActiveActor(normalizedEvent);
  await saveActiveGroup(normalizedEvent);
  await indexEvent(normalizedEvent);
  await saveEventToElasticsearch(normalizedEvent);
}
