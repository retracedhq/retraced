import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { elasticsearchIndexRotator } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function elasticsearchIndexRotatorWorkflow(): Promise<void> {
  await elasticsearchIndexRotator();
}
