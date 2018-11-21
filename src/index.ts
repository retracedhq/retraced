import "source-map-support/register";
import * as url from "url";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as _ from "lodash";
import * as bugsnag from "bugsnag";
import * as Sigsci from "sigsci-module-nodejs";
import * as Prometheus from "prom-client";
import * as swaggerUI from "swagger-ui-express";

import { register, wrapRoute } from "./router";
import { LegacyRoutes } from "./routes";
import { RegisterRoutes } from "./gen/routes";
import { AdminUserBootstrap } from "./handlers/admin/AdminUserBootstrap";
import { ensureHeadlessProject } from "./headless";
import * as metrics from "./metrics";
import swaggerSpecs from "./swagger";
import getPgPool from "./persistence/pg";

import "./controllers/PublisherController";
import "./controllers/AdminController";
import "./controllers/EnterpriseController";
import { logger } from "./logger";
import * as fs from "fs";
import * as https from "https";

if (!process.env["BUGSNAG_TOKEN"]) {
  logger.error("BUGSNAG_TOKEN not set, error reports will not be sent to bugsnag");
} else {
  bugsnag.register(process.env["BUGSNAG_TOKEN"] || "", {
    releaseStage: process.env["STAGE"],
    notifyReleaseStages: ["production", "staging"],
  });
}

const app = express();
const router = express.Router();

let basePath = "";
if (process.env["RETRACED_API_BASE"]) {
  basePath = url.parse(process.env["RETRACED_API_BASE"] || "").pathname || "";
}
logger.info(`listening on basePath ${basePath}`);

// Sigsci middleware has to be installed before routes and other middleware
if (!process.env["SIGSCI_RPC_ADDRESS"]) {
  logger.error("SIGSCI_RPC_ADDRESS not set, Signal Sciences module will not be installed");
} else {
  const sigsci = new Sigsci({
    path: process.env.SIGSCI_RPC_ADDRESS,
  });
  app.use(sigsci.express());
}

app.set("etag", false); // we're doing our own etag thing I guess
// The nearest ip address in the X-Forwarded-For header not in a private
// subnet will be used as req.ip.
app.set("trust proxy", "uniquelocal");

app.use(bugsnag.requestHandler);
app.use(bodyParser.json());
app.use(cors());
app.use(bugsnag.errorHandler);

buildRoutes();
serve();
metrics.bootstrapFromEnv();

function buildRoutes() {

  registerHealthchecks();

  swaggerSpecs.forEach((spec) => {
    logger.debug(`GET    '${spec.path}/swagger.json'`);
    logger.debug(`GET    '${spec.path}/swagger'`);
    router.get(`${basePath}${spec.path}/swagger.json`, (req, res) => {
      res.setHeader("ContentType", "application/json");
      res.send(spec.swagger);
    });
    router.use(`${basePath}${spec.path}/swagger`, swaggerUI.serve, swaggerUI.setup(spec.swagger));
  });

  RegisterRoutes(router);

  _.forOwn(LegacyRoutes(), (route, handlerName: string) => {
    const handler = wrapRoute(route, handlerName);
    register(route, handler, router, basePath);
  });

  if (process.env.ADMIN_ROOT_TOKEN) {
    const route = { method: "post", path: "/admin/v1/user/_login" };
    const handler = wrapRoute({ handler: AdminUserBootstrap.default().handler() }, "_login");
    register(route, handler, router, basePath);
  }

  if (process.env.RETRACED_ENABLE_PROMETHEUS) {
    const endpoint = process.env.RETRACED_PROMETHEUS_ENDPOINT || "/metrics";
    logger.info(`Registering Prometheus Exporter at ${endpoint}`);
    app.get("/metrics", (req, res) => {
      res.set("Content-Type", Prometheus.register.contentType);
      const mtx = Prometheus.register.metrics();
      res.end(mtx);
    });
  }
  app.use(process.env.API_BASE_URL_PATH || "", router);

  app.use((req, res, next) => {
    const errMsg = `Route not found for ${req.method} ${req.originalUrl}`;
    logger.error(`[${req.ip}] ${errMsg}`);
    res.status(404).send(errMsg);
  });

}

export function registerHealthchecks() {
  // Needed for Kubernetes health checks
  app.get("/", (req, res) => {
    // trying a slight delay to keep sigsci from freaking out
    setTimeout(() => res.send(""), 200);
  });
  app.get(`${basePath}/`, (req, res) => {
    // trying a slight delay to keep sigsci from freaking out
    setTimeout(() => res.send(""), 200);
  });

  // Needed for Kubernetes health checks
  app.get("/healthz", (req, res) => {
    // trying a slight delay to keep sigsci from freaking out
    setTimeout(() => res.send(""), 200);
  });

  // Needed for Kubernetes health checks
  app.get("/metricz", (req, res) => {
    setTimeout(() => res.send("{}"), 200);
  });

}

function serve() {
  const sslCertPath = process.env.SSL_SERVER_CERT_PATH;
  const sslKeyPath = process.env.SSL_SERVER_KEY_PATH;
  if (!sslCertPath || !sslKeyPath) {
    logger.info("SSL_SERVER_CERT_PATH or SSL_SERVER_KEY_PATH unset, serving HTTP");
    serveHTTP();
  } else {
    logger.info("Found SSL parameters, serving with HTTPS");
    serveHTTPS(sslCertPath, sslKeyPath);
  }
}

function serveHTTP() {
  app.listen(3000, "0.0.0.0", () => {
    logger.info("Retraced API listening on port 3000...");
  });
}

function serveHTTPS(sslCertPath: string, sslKeyPath: string) {
  // These will throw if either file isn't present or isn't readable
  // The error stack is pretty good, don't think we need to catch/wrap here for now
  const certificate = fs.readFileSync(sslCertPath);
  const privateKey = fs.readFileSync(sslKeyPath);

  https.createServer({
    key: privateKey,
    cert: certificate,
  }, app).listen(3000, "0.0.0.0", () => {
    logger.info("Retraced API listening on port 3000...");
  });

}

ensureHeadlessProject();

process.on("SIGTERM", async () => {
  logger.info("Got SIGTERM. Graceful shutdown start", new Date().toISOString());
  logger.info("draining postgres pool");
  await getPgPool().end();
  logger.info("postgres pool drained");
  process.exit(137);
});
