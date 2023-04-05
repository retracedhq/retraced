import { proxyActivities } from "@temporalio/workflow";

import type { Job } from "../../../handlers/viewer/searchEvents";
import type * as activities from "../../workers";

const { saveUserReportingEvent } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
  retry: {
    maximumAttempts: 1,
  },
});

export async function saveUserReportingEventWorkflow(job: Job) {
  await saveUserReportingEvent(job);
}
