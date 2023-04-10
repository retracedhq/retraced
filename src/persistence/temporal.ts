import { WorkflowClient, Connection } from "@temporalio/client";

import { logger } from "../logger";
import config from "../config";

let connection: Connection;

const createWorkflowClient = async (): Promise<WorkflowClient> => {
  if (!connection) {
    connection = await Connection.connect({
      address: config.TEMPORAL_ADDRESS,
    });

    logger.info("New Temporal connection created");
  }

  return new WorkflowClient({ connection });
};

export default createWorkflowClient;
