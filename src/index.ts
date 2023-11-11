import url from "url";
import express from "express";
import cors from "cors";
import _ from "lodash";
import Bugsnag from "@bugsnag/js";
import swaggerUI from "swagger-ui-express";
import config from "./config";
import { register, wrapRoute } from "./router";
import { LegacyRoutes } from "./routes";
import { RegisterRoutes } from "./gen/routes";
import { AdminUserBootstrap } from "./handlers/admin/AdminUserBootstrap";
import { ensureHeadlessProject } from "./headless";
import "./metrics";
import swaggerSpecs from "./swagger";
import getPgPool from "./persistence/pg";

import "./controllers/PublisherController";
import "./controllers/AdminController";
import "./controllers/EnterpriseController";
import { logger } from "./logger";
import fs from "fs";
import https from "https";
import sslConf from "ssl-config";
import { startErrorNotifier } from "./error-notifier";

const app = express();
const router = express.Router();

let basePath = "";
if (config.API_BASE_URL_PATH) {
  basePath = url.parse(config.API_BASE_URL_PATH || "").pathname || "";
}
logger.info(`listening on basePath ${basePath}`);

app.set("etag", false); // we're doing our own etag thing I guess
// The nearest ip address in the X-Forwarded-For header not in a private
// subnet will be used as req.ip.
app.set("trust proxy", "uniquelocal");

const notifierEnabled = startErrorNotifier(true);

const bugSnagMiddleware = Bugsnag.getPlugin("express");

if (notifierEnabled && bugSnagMiddleware) {
  app.use(bugSnagMiddleware.requestHandler);
}
app.use(express.json({ limit: "10mb" }));
app.use(cors());
if (notifierEnabled && bugSnagMiddleware) {
  app.use(bugSnagMiddleware.errorHandler);
}

buildRoutes();
serve();

function buildRoutes() {
  registerHealthchecks();

  swaggerSpecs.forEach((spec) => {
    logger.debug(`GET    '${spec.path}/swagger.json'`);
    logger.debug(`GET    '${spec.path}/swagger'`);
    router.get(`${spec.path}/swagger.json`, (req, res) => {
      res.setHeader("ContentType", "application/json");
      res.send(spec.swagger);
    });
    router.use(`${spec.path}/swagger`, swaggerUI.serve, swaggerUI.setup(spec.swagger));
  });

  RegisterRoutes(router);

  _.forOwn(LegacyRoutes(), (route, handlerName: string) => {
    const handler = wrapRoute(route, handlerName);
    register(route, handler, router);
  });

  if (config.ADMIN_ROOT_TOKEN) {
    const route = { method: "post", path: "/admin/v1/user/_login" };
    const handler = wrapRoute({ handler: AdminUserBootstrap.default().handler() }, "_login");
    register(route, handler, router);
  }

  app.use(basePath, router);

  app.use((req, res) => {
    const errMsg = "Not Found";
    logger.error(`[${req.ip}] ${req.path} ${errMsg}`);
    res.status(404).send(errMsg);
  });
}

export function registerHealthchecks() {
  // Needed for Kubernetes health checks
  app.get("/", (req, res) => {
    res.send("");
  });
  app.get(`${basePath}/`, (req, res) => {
    res.send("");
  });

  // Needed for Kubernetes health checks
  app.get("/healthz", (req, res) => {
    res.send("");
  });

  // Needed for Kubernetes health checks
  app.get("/metricz", (req, res) => {
    setTimeout(() => res.send("{}"), 200);
  });
}

function serve() {
  const sslCertPath = config.SSL_SERVER_CERT_PATH;
  const sslKeyPath = config.SSL_SERVER_KEY_PATH;
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

  const sslConfig = sslConf("modern");

  https
    .createServer(
      {
        key: privateKey,
        cert: certificate,
        ciphers: sslConfig.ciphers,
        honorCipherOrder: true,
        secureOptions: sslConfig.minimumTLSVersion,
      },
      app
    )
    .listen(3000, "0.0.0.0", () => {
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
