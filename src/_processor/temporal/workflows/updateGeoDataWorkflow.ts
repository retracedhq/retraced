import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { updateGeoData } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function updateGeoDataWorkflow() {
  await updateGeoData();
}
