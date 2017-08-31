import "source-map-support/register";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as _ from "lodash";
import * as bugsnag from "bugsnag";
import * as Sigsci from "sigsci-module-nodejs";
import * as swaggerUI from "swagger-ui-express";

import { register, wrapRoute } from "./router";
import { LegacyRoutes } from "./routes";
import { RegisterRoutes } from "./gen/routes";
import { AdminUserBootstrap } from "./handlers/admin/AdminUserBootstrap";
import { ensureHeadlessProject } from "./headless";
import * as metrics from "./metrics";
import swaggerSpecs from "./swagger";

import "./controllers/PublisherController";
import "./controllers/AdminController";
import "./controllers/EnterpriseController";
import { logger } from "./logger";

if (!process.env["BUGSNAG_TOKEN"]) {
  logger.error("BUGSNAG_TOKEN not set, error reports will not be sent to bugsnag");
} else {
  bugsnag.register(process.env["BUGSNAG_TOKEN"], {
    releaseStage: process.env["BUGSNAG_STAGE"],
    notifyReleaseStages: ["production", "staging"],
  });
}

const app = express();

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

  // Needed for Kubernetes health checks
  app.get("/", (req, res) => {
    // trying a slight delay to keep sigsci from freaking out
    setTimeout(() => res.send(""), 200);
  });

  swaggerSpecs.forEach((spec) => {
    logger.debug(`GET    '${spec.path}/swagger.json'`);
    logger.debug(`GET    '${spec.path}/swagger'`);
    app.get(`${spec.path}/swagger.json`, (req, res) => {
      res.setHeader("ContentType", "application/json");
      res.send(spec.swagger);
    });
    app.use(`${spec.path}/swagger`, swaggerUI.serve, swaggerUI.setup(spec.swagger));
  });

  RegisterRoutes(app);

  _.forOwn(LegacyRoutes(), (route, handlerName: string) => {
    const handler = wrapRoute(route, handlerName);
    register(route, handler, app);
  });

  if (process.env.ADMIN_ROOT_TOKEN) {
    const route = { method: "post", path: "/admin/v1/user/_login" };
    const handler = wrapRoute({ handler: AdminUserBootstrap.default().handler() }, "_login");
    register(route, handler, app);
  }

  app.use((req, res, next) => {
    const errMsg = `Route not found for ${req.method} ${req.originalUrl}`;
    logger.error(`[${req.ip}] ${errMsg}`);
    res.status(404).send(errMsg);
  });

}

function serve() {
  app.listen(3000, "0.0.0.0", () => {
    logger.info("Retraced API listening on port 3000...");
  });
}

ensureHeadlessProject();
