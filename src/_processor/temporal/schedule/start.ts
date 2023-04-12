import type { ScheduleOptions } from "@temporalio/client";
import { Connection, Client, ScheduleOverlapPolicy } from "@temporalio/client";

import config from "../../../config";
import {
  ingestFromBacklogWorkflow,
  normalizeRepairWorkflow,
  pruneViewerDescriptorsWorkflow,
} from "../workflows";

const schedules: ScheduleOptions[] = [
  {
    action: {
      type: "startWorkflow",
      taskQueue: "events",
      workflowType: ingestFromBacklogWorkflow,
    },
    scheduleId: "workflow-ingest-from-backlog",
    policies: {
      catchupWindow: "1 day",
      overlap: ScheduleOverlapPolicy.SKIP,
    },
    spec: {
      intervals: [{ every: "1s" }],
    },
  },

  {
    action: {
      type: "startWorkflow",
      taskQueue: "events",
      workflowType: normalizeRepairWorkflow,
    },
    scheduleId: "workflow-normalize-repair",
    policies: {
      catchupWindow: "1 day",
      overlap: ScheduleOverlapPolicy.SKIP,
    },
    spec: {
      intervals: [{ every: "10m" }],
    },
  },

  {
    action: {
      type: "startWorkflow",
      taskQueue: "events",
      workflowType: pruneViewerDescriptorsWorkflow,
    },
    scheduleId: "workflow-prune-viewer-descriptors",
    policies: {
      catchupWindow: "1 day",
      overlap: ScheduleOverlapPolicy.SKIP,
    },
    spec: {
      intervals: [{ every: "10m" }],
    },
  },
];

async function run() {
  await waitForNamespaceToBeReady();

  // Wait for namespace cache to be updated
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const connection = await Connection.connect({
    address: config.TEMPORAL_ADDRESS,
  });

  const client = new Client({
    connection,
  });

  await Promise.all(schedules.map((schedule) => client.schedule.create(schedule)));

  await client.connection.close();
}

async function waitForNamespaceToBeReady() {
  const connection = await Connection.connect({
    address: config.TEMPORAL_ADDRESS,
  });

  let namespaceExist = false;

  while (!namespaceExist) {
    try {
      const result = await connection.workflowService.describeNamespace({
        namespace: "default",
      });

      if (result) {
        console.info("Namespace is ready.");
        namespaceExist = true;
        break;
      }
    } catch (error) {
      console.error("Namespace is not ready yet. Retrying in 5 seconds...");
    }

    // Wait before trying again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
