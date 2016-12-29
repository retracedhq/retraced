import "source-map-support/register";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as _ from "lodash";
import * as uuid from "uuid";
import * as chalk from "chalk";
import * as util from "util";

import routes from "./routes";

const app = express();

app.use(bodyParser.json());
app.use(cors());

buildRoutes();
serve();

function buildRoutes() {
  // Needed for Kubernetes health checks
  app.get("/", (req, res) => {
    res.send("");
  });

  // Define the handling callback for each route.
  _.forOwn(routes, (route, handlerName) => {
    const routeCallback = (req, res) => {
      const reqId = `${handlerName}:${uuid.v4().replace("-", "").substring(0, 8)}`;
      console.log(chalk.yellow(`[${reqId}] <- ${req.method} ${req.originalUrl}`));
      if (!_.isEmpty(req.body)) {
        let bodyString = JSON.stringify(req.body);
        if (bodyString.length > 512) {
          bodyString = `${bodyString.substring(0, 512)} (... truncated, total ${bodyString.length} bytes)`;
        }
        console.log(chalk.yellow(`[${reqId}] <- ${bodyString}`));
      }

      const handlerFunc = route.handler;

      // FIXME: I couldn't get this to work using async/await. Node kept complaining about
      // unhandled promise rejections. Something to do with the transpiler?
      handlerFunc(req)
        .then((result) => {
          if (result) {
            let statusToSend = result.status || 200;
            let contentType = result.contentType || "application/json";

            let bodyToLog = result.body;
            if (!bodyToLog) {
              bodyToLog = "";
            } else if (bodyToLog.length > 512) {
              bodyToLog = `${bodyToLog.substring(0, 512)} (... truncated, total ${bodyToLog.length} bytes)`;
            }
            console.log(chalk.cyan(`[${reqId}] => ${result.status} ${bodyToLog}`));
            let respObj = res.status(statusToSend).type(contentType);
            if (result.filename) {
              respObj.attachment(result.filename);
            }
            respObj.send(result.body);
          } else {
            // Generic response. Shouldn't happen, but...
            console.log(chalk.cyan(`[${reqId}] => 200`));
            res.status(200).json(result);
          }
        })
        .catch((err) => {
          if (err.status && err.err) {
            // Structured error, specific status code and error object.
            console.log(chalk.red(`[${reqId}] !! ${err.status} ${err.err.stack}`));
            res.status(err.status).json(err.err);
          } else {
            // Generic error, default code.
            console.log(chalk.red(`[${reqId}] !! 500 ${err.stack}`));
            res.status(500).json(err);
          }
        });
    };

    // Register this route and callback with express.
    console.log(`[${route.method}] '${route.path}'`);
    if (route.method === "get") {
      app.get(route.path, routeCallback);
    } else if (route.method === "post") {
      app.post(route.path, routeCallback);
    } else if (route.method === "put") {
      app.put(route.path, routeCallback);
    } else {
      console.log(`Unhandled HTTP method: '${route.method}'`);
    }
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
