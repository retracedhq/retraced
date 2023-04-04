import { proxyActivities } from "@temporalio/workflow";

import type { Opts } from "../activities/analyzeDay";
import type * as activities from "../activities";

const { analyzeDay } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function analyzeDayWorkflow(job: Opts): Promise<void> {
  await analyzeDay(job);
}
