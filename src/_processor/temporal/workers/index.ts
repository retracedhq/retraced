import { Worker, NativeConnection } from "@temporalio/worker";
import type { WorkerOptions } from "@temporalio/worker";

import * as activities from "../../workers";
import config from "../../../config";

async function run() {
  const connection = await NativeConnection.connect({
    address: config.TEMPORAL_ADDRESS,
  });

  const workers: WorkerOptions[] = [
    {
      workflowsPath: require.resolve("../workflows"),
      activities,
      taskQueue: "events",
      connection,
      maxConcurrentActivityTaskExecutions: 500,
      // maxConcurrentActivityTaskExecutions: 1000,
      // maxCachedWorkflows: 1000,
    },
  ];

  if (config.PG_SEARCH) {
    console.log("PG_SEARCH set, using Postgres search");
  } else {
    console.log("PG_SEARCH not set, using ElasticSearch");
  }

  await Promise.all(workers.map((worker) => Worker.create(worker).then((w) => w.run())));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
