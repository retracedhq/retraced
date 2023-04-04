import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { elasticsearchAliasVerify } = proxyActivities<typeof activities>({});

export async function elasticsearchAliasVerifyWorkflow(): Promise<void> {
  await elasticsearchAliasVerify();
}
