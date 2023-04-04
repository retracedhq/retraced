import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "../../workers";

const { updateGeoData } = proxyActivities<typeof activities>({});

export async function updateGeoDataWorkflow(): Promise<void> {
  await updateGeoData();
}
