import express from "express";
import { logger } from "./logger";
import { AnalyticsController } from "./analytics";
import config from "../config";

const app = express();
let lastNSQ: Date = new Date();

export async function startHealthz() {
  if (!config.RETRACED_NO_ANALYTICS) {
    console.info(
      "Anonymous analytics enabled. You can disable this by setting the DO_NOT_TRACK=1 or RETRACED_NO_ANALYTICS=1 environment variables"
    );

    await new AnalyticsController().init();
  }

  // Needed for Kubernetes health checks
  app.get("/healthz", (req, res) => {
    res.status(200).send("");
  });

  // Needed for Kubernetes health checks
  app.get("/livez", (req, res) => {
    const currentTime: Date = new Date();
    // 1000 * 60 * 60 is one hour
    if (currentTime > new Date(lastNSQ.getTime() + 1000 * 60 * 60)) {
      res.status(500).send(`{"lastNSQ": ${lastNSQ.getTime()}, "status": "Unhealthy"}`);
    }
    res.status(200).send(`{"lastNSQ": ${lastNSQ.getTime()}}, "status": "Healthy"}`);
  });

  const port = Number(process.env.PROCESSOR_DEV_PORT || 3000);
  app.listen(port, "0.0.0.0", () => {
    logger.info(`Processor health checks listening on port ${port}...`);
  });
}

export function updateLastNSQ() {
  lastNSQ = new Date();
}
