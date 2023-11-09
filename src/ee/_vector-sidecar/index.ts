import express from "express";
import setupRoutes from "./routes";
import config from "./config";
import { ConfigManager } from "./services/configManager";
import watchers from "./watchers";
import { addConsumers } from "./watchers/consumers";

ConfigManager.init();
watchers.init();

const app = express();
app.use(express.json());

setupRoutes(app);

app.listen(config.PORT, () => {
  console.log(`Vector Management API listening at http://localhost:${config.PORT}`);
});

// detect CTRL-C and gracefully exit
process.on("SIGINT", () => {
  console.log("Closing");
  process.exit();
});

// catch all uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("Uncaught exception");
  console.error(err);
});

addConsumers();
