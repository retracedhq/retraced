import express from "express";
import setupRoutes from "./routes";
import config from "./config";
import { ConfigManager } from "./services/configManager";
import watchers from "./watchers";
import nsq from "../../_processor/persistence/nsq";
import { handleSinkCreated, handleSinkDeleted } from "./services/vector";

ConfigManager.init();
watchers.init();

const app = express();
app.use(express.json());

setupRoutes(app);

app.listen(config.port, () => {
  console.log(`Vector Management API listening at http://localhost:${config.port}`);
});

// detect CTRL-C and gracefully exit
process.on("SIGINT", () => {
  console.log("Closing");
  process.exit();
});

nsq.consume(
  "sink_created",
  "vector_sidecar",
  async (msg) => {
    const sink = JSON.parse(msg.body);
    await handleSinkCreated(sink);
  },
  {
    maxAttempts: 1,
    maxInFlight: 5,
    messageTimeoutMS: 10000,
  }
);

nsq.consume(
  "sink_deleted",
  "vector_sidecar",
  async (msg) => {
    const sink = JSON.parse(msg.body);
    await handleSinkDeleted(sink);
  },
  {
    maxAttempts: 1,
    maxInFlight: 5,
    messageTimeoutMS: 10000,
  }
);

nsq.consume(
  "sink_updated",
  "vector_sidecar",
  async (msg) => {
    const sink = JSON.parse(msg.body);
    await handleSinkDeleted(sink);
    await handleSinkCreated(sink);
  },
  {
    maxAttempts: 1,
    maxInFlight: 5,
    messageTimeoutMS: 10000,
  }
);
