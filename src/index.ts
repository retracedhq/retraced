import "source-map-support/register";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as _ from "lodash";
import * as uuid from "uuid";
import * as chalk from "chalk";
import * as util from "util";
import * as bugsnag from "bugsnag";
import * as Sigsci from "sigsci-module-nodejs";
import * as swaggerUI from "swagger-ui-express";

import { wrapRoute, register, requestId, preRequest, onSuccess, onError } from "./router";
import { LegacyRoutes } from "./routes";
import { RegisterRoutes } from "./gen/routes";

import "./controllers/PublisherController";

import * as metrics from "./metrics";
import * as swagger from "./swagger";

if (!process.env["BUGSNAG_TOKEN"]) {
  console.error("BUGSNAG_TOKEN not set, error reports will not be sent to bugsnag");
} else {
  bugsnag.register(process.env["BUGSNAG_TOKEN"], {
    releaseStage: process.env["BUGSNAG_STAGE"],
    notifyReleaseStages: ["production", "staging"],
  });
}

const app = express();

// Sigsci middleware has to be installed before routes and other middleware
if (!process.env["SIGSCI_RPCADDRESS"]) {
  console.error("SIGSCI_RPCADDRESS not set, Signal Sciences module will not be installed");
} else {
  const sigsci = new Sigsci({
    path: process.env.SIGSCI_RPCADDRESS,
  });
  app.use(sigsci.express());
}

app.set("etag", false); // we're doing our own etag thing I guess

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
    res.send("");
  });

  app.get("/publisher/v1/swagger.json", (req, res) => {
    res.setHeader("ContentType", "application/json");
    res.send(swagger.publisherApi);
  });

  app.use("/publisher/v1/swagger", swaggerUI.serve, swaggerUI.setup(swagger.publisherApi));

  RegisterRoutes(app);

  _.forOwn(LegacyRoutes(), (route, handlerName: string) => {
    const handler = wrapRoute(route, handlerName);
    register(route, handler, app);
  });

  app.use((req, res, next) => {
    const errMsg = `Route not found for ${req.method} ${req.originalUrl}`;
    console.log(chalk.red(`[${req.ip}] ${errMsg}`));
    res.status(404).send(errMsg);
  });
}

function serve() {
  app.listen(3000, "0.0.0.0", () => {
    console.log("Retraced API listening on port 3000...");
  });
}
