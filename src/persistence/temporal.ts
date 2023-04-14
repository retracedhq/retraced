import { Connection, Client } from "@temporalio/client";

import config from "../config";

let connection: Connection;

const getTemporalClient = async (): Promise<Client> => {
  if (!connection) {
    connection = await Connection.connect({
      address: config.TEMPORAL_ADDRESS,
    });
  }

  return new Client({ connection });
};

export default getTemporalClient;
