import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { elasticsearchAliasVerify } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function elasticsearchAliasVerifyWorkflow() {
  await elasticsearchAliasVerify();
}
