import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { elasticsearchAliasVerify } = proxyActivities<typeof activities>({
  startToCloseTimeout: "300 seconds",
  retry: {
    maximumAttempts: 1,
  },
});

export async function elasticsearchAliasVerifyWorkflow() {
  await elasticsearchAliasVerify();
}
