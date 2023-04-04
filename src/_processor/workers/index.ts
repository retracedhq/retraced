import { Worker } from "@temporalio/worker";
import type { WorkerOptions } from "@temporalio/worker";

import * as activities from "../activities";

const workers: WorkerOptions[] = [
  {
    workflowsPath: require.resolve("../workflows"),
    activities,
    taskQueue: "events",
  },
];

async function run() {
  await Promise.all(workers.map((worker) => Worker.create(worker).then((w) => w.run())));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
