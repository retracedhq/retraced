import { proxyActivities } from "@temporalio/workflow";

import type { Opts } from "../../workers/analyzeDay";
import type * as activities from "../../workers";

const { analyzeDay } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function analyzeDayWorkflow(job: Opts) {
  await analyzeDay(job);
}
