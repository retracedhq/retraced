import express from "express";
import setupRoutes from "./routes";
import config from "../../config";
import { addConsumers } from "./watchers/consumers";
import { logger } from "../../logger";

const app = express();
app.use(express.json());

setupRoutes(app);

app.listen(config.SIDECAR_PORT, () => {
  logger.info(`Sidecar Management API listening at http://localhost:${config.SIDECAR_PORT}`);
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
