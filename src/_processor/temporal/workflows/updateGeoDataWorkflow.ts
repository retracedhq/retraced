import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { updateGeoData } = proxyActivities<typeof activities>({
  startToCloseTimeout: "900 seconds",
  retry: {
    maximumAttempts: 1,
  },
});

export async function updateGeoDataWorkflow() {
  await updateGeoData();
}
