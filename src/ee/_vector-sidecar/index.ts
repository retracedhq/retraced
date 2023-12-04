import express from "express";
import setupRoutes from "./routes";
import config from "../../config";
import { ConfigManager } from "./services/configManager";
import watchers from "./watchers";
import { addConsumers } from "./watchers/consumers";
import { logger } from "../../logger";

ConfigManager.init();
watchers.init();

const app = express();
app.use(express.json());

setupRoutes(app);

app.listen(config.VECTOR_SIDECAR_PORT, () => {
  logger.info(`Vector Management API listening at http://localhost:${config.VECTOR_SIDECAR_PORT}`);
});

// detect CTRL-C and gracefully exit
process.on("SIGINT", () => {
  logger.info("SIGINT signal received.");
  process.exit();
});

// catch all uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.info("Uncaught exception");
  logger.error(err);
});

addConsumers();
