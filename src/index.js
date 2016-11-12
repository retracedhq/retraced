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
if (process.env.BUGSNAG_PROJECT_ID) {
  bugsnag.register(process.env.BUGSNAG_PROJECT_ID);
  app.use(bugsnag.requestHandler);
}

app.use(bodyParser.json());
app.use(cors());

if (process.env.BUGSNAG_PROJECT_ID) {
  app.use(bugsnag.errorHandler);
}

buildRoutes();
serve();

function buildRoutes() {
  // Needed for Kubernetes health checks
  app.get('/', (req, res) => {
    res.send('');
  });

  // Define the handling callback for each route.
  _.forOwn(routes, (route, handlerName) => {
    const routeCallback = async (req, res) => {
      const reqId = `${handlerName}:${uuid.v4().replace('-', '').substring(0, 8)}`;
      console.log(chalk.yellow(`[${reqId}] <- ${req.method} ${req.originalUrl}`));
      if (!_.isEmpty(req.body)) {
        let bodyString = JSON.stringify(req.body);
        if (bodyString.length > 512) {
          bodyString = `${bodyString.substring(0, 512)} (... truncated, total ${bodyString.length} bytes)`;
        }
        console.log(chalk.yellow(`[${reqId}] <- ${bodyString}`));
      }

      // TODO(zhaytee): Do this without require()
      const handlerFunc = require(`./handlers/${handlerName}`);

      let result;
      try {
        result = await handlerFunc(req);
      } catch (e) {
        if (e.status && e.err) {
          // Structured error, specific status code and error object.
          console.log(chalk.red(`[${reqId}] !! ${e.status} ${e.err}`));
          res.status(e.status).json(e.err);
        } else {
          // Generic error, default code.
          console.log(chalk.red(`[${reqId}] !! 500 ${e}`));
          res.status(500).json(e);
        }
        return;
      }

      if (result.status && result.body) {
        // Structured result, specific status code and response object.
        let responseString = JSON.stringify(result.body);
        if (responseString.length > 512) {
          responseString = `${responseString.substring(0, 512)} (... truncated, total ${responseString.length} bytes)`;
        }
        console.log(chalk.cyan(`[${reqId}] => ${result.code} ${responseString}`));
        res.status(result.status).json(result.body);
      } else {
        // Generic result, default code.
        let responseString = JSON.stringify(result);
        if (responseString.length > 512) {
          responseString = `${responseString.substring(0, 512)} (... truncated, total ${responseString.length} bytes)`;
        }
        console.log(chalk.cyan(`[${reqId}] => 200 ${responseString}`));
        res.status(200).json(result);
      }
    }

    // Register this route and callback with express.
    console.log(`[${route.method}] '${route.path}'`);
    if (route.method === 'get') {
      app.get(route.path, routeCallback);
    } else if (route.method === 'post') {
      app.post(route.path, routeCallback);
    } else if (route.method === 'put') {
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
  app.listen(3000, () => {
    console.log('Retraced API listening on port 3000...');
  });
}
