import { proxyActivities } from "@temporalio/workflow";

import type { Job } from "../../../handlers/viewer/searchEvents";
import type * as activities from "../../workers";

const { saveUserReportingEvent } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function saveUserReportingEventWorkflow(job: Job) {
  await saveUserReportingEvent(job);
}
