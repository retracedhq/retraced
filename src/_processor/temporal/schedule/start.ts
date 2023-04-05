import type { ScheduleOptions } from "@temporalio/client";
import { Connection, Client, ScheduleOverlapPolicy } from "@temporalio/client";

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
  const client = new Client({
    connection: await Connection.connect(),
  });

  await Promise.all(schedules.map((schedule) => client.schedule.create(schedule)));

  await client.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
