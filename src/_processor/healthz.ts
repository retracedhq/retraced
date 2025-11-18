import * as express from "express";
import { logger } from "./logger";

const app = express();
let lastNSQ: Date = new Date();

export function startHealthz() {
    // Needed for Kubernetes health checks
    app.get("/healthz", (req, res) => {
        res.status(200).send("");
    });

    // Needed for Kubernetes health checks
    app.get("/livez", (req, res) => {
        const currentTime: Date = new Date();
        // 1000 * 60 * 60 is one hour
        if (currentTime > new Date(lastNSQ.getTime() + (1000 * 60 * 60))) {
            logger.error(`Liveness check failed: lastNSQ was ${currentTime.getTime() - lastNSQ.getTime()}ms ago (threshold: 3600000ms)`);
            res.status(500).send(`{"lastNSQ": ${lastNSQ.getTime()}, "status": "Unhealthy"}`);
        } else {
            res.status(200).send(`{"lastNSQ": ${lastNSQ.getTime()}, "status": "Healthy"}`);
        }
    });

    app.listen(3000, "0.0.0.0", () => {
        logger.info("Processor health checks listening on port 3000...");
    });
}

export function updateLastNSQ() {
    lastNSQ = new Date();
}
