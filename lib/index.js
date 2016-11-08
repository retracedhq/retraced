'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const _ = require('lodash');
const fs = require('fs');
const yaml = require('js-yaml');
const uuid = require('uuid');
const bugsnag = require('bugsnag');

const slsParamRegex = /{([^}]+)}/;

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

  const slsConf = yaml.safeLoad(fs.readFileSync('serverless.yml', 'utf8'));
  _.forEach(slsConf.functions, (func, name) => {
    _.forEach(func.events, (eventObj) => {
      _.forEach(eventObj, (event, eventType) => {
        if (eventType === 'http') {
          let toks = event.path.split('/');
          toks = _.map(toks, (tok) => {
            if (tok.includes('{')) {
              return `:${tok.match(slsParamRegex)[1]}`;
            }
            return tok;
          });
          let finalPath = toks.join('/');
          if (!finalPath.startsWith('/')) {
            finalPath = `/${finalPath}`;
          }

          const handlerName = func.handler.split('.')[0];
          const routeCallback = (req, res) => {
            const reqId = uuid.v4().replace('-', '').substring(0, 8);
            console.log(`[${reqId}] <- ${req.method} ${req.originalUrl}`);
            if (!_.isEmpty(req.body)) {
              let bodyString = JSON.stringify(req.body);
              if (bodyString.length > 512) {
                bodyString = `${bodyString.substring(0, 512)} (... truncated, total ${bodyString.length} bytes)`;
              }
              console.log(`[${reqId}] <- ${bodyString}`);
            }
            const lambdaEvent = getLambdaEvent(req);
            require(`../${handlerName}`).default(lambdaEvent, {}, (err, body) => {
              if (err) {
                console.log(`[${reqId}] !! ${err}`);
                sendError(err, res);
                return;
              }
              let responseString = JSON.stringify(body);
              if (responseString.length > 512) {
                responseString = `${responseString.substring(0, 512)} (... truncated, total ${responseString.length} bytes)`;
              }
              console.log(`[${reqId}] => ${responseString}`);
              res.send(body);
            });
          };

          console.log(`[${event.method}] ${finalPath}`);
          if (event.method === 'get') {
            app.get(finalPath, routeCallback);
          } else if (event.method === 'post') {
            app.post(finalPath, routeCallback);
          } else if (event.method === 'put') {
            app.put(finalPath, routeCallback);
          } else {
            console.log(`Unhandled HTTP method: '${event.method}'`);
          }
        } else {
          console.log(`Ignoring function event of type '${eventType}'`);
        }
      });
    });
  });
}

function serve() {
  app.listen(3000, () => {
    console.log('Retraced API listening on port 3000...');
  });
}

function getLambdaEvent(req) {
  const lambdaEvent = {
    body: req.body,
    path: req.params,
    headers: req.headers,
    query: req.query,

    // TODO(zhaytee): Remove this once we ditch SNS.
    isOffline: !!process.env.RETRACED_API_OFFLINE,
  };

  if (_.has(lambdaEvent.headers, 'authorization')) {
    lambdaEvent.headers.Authorization = lambdaEvent.headers.authorization;
    delete lambdaEvent.headers.authorization;
  }

  return lambdaEvent;
}

function sendError(err, res) {
  if (process.env.BUGSNAG_PROJECT_ID) {
    console.log(`Sending error to bugsnag stage ${process.env.NODE_ENV}`);
    bugsnag.notify(err);
  }

  let errorStatusCode = 500;
  const errorMessage = (err.message || err).toString();
  const re = /\[(\d{3})\]/;
  const found = errorMessage.match(re);
  if (found && found.length > 1) {
    errorStatusCode = parseInt(found[1], 10);
  }

  res.status(errorStatusCode).send(errorMessage);
}
