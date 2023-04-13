import { WorkflowClient, Connection } from "@temporalio/client";

import config from "../config";

let connection: Connection;

const createWorkflowClient = async (): Promise<WorkflowClient> => {
  if (!connection) {
    connection = await Connection.connect({
      address: config.TEMPORAL_HOST,
    });
  }

  return new WorkflowClient({ connection });
};

export default createWorkflowClient;
