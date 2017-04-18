import * as _ from "lodash";

import * as bugsnag from "bugsnag";
import * as chalk from "chalk";
import * as express from "express";
import * as util from "util";
import * as uuid from "uuid";

export const onSuccess = (res: express.Response, reqId: string, statusCodeGetter?: () => number|undefined) => (result: any) => {

  if (result) {

    const statusToSend = result.status || (statusCodeGetter && statusCodeGetter()) || 200;
    const body = result.body || JSON.stringify(result);
    const contentType = result.contentType || "application/json";

    let bodyToLog = body;
    if (!bodyToLog) {
      bodyToLog = "";
    } else if (bodyToLog.length > 512) {
      bodyToLog = `${bodyToLog.substring(0, 512)} (... truncated, total ${bodyToLog.length} bytes)`;
    }
    console.log(chalk.cyan(`[${reqId}] => ${result.status} ${bodyToLog}`));
    const respObj = res.status(statusToSend).type(contentType).set("X-Retraced-RequestId", reqId);
    if (result.filename) {
      respObj.attachment(result.filename);
    }
    if (result.headers) {
      _.forOwn(result.headers, (value, key) => {
        respObj.set(key!, value);
      });
    }
    respObj.send(body);
  } else {
    // Generic response. Shouldn't happen in most cases, but...
    console.log(chalk.cyan(`[${reqId}] => 200`));
    res.status(200).set("X-Retraced-RequestId", reqId).json(result);
  }
};

export const onError = (res: express.Response, reqId: string) => (err: any) => {

  bugsnag.notify(err);
  if (err.status) {
    // Structured error, specific status code.
    const errMsg = err.err ? err.err.message : "An unexpected error occurred";
    console.log(chalk.red(`[${reqId}] !! ${err.status} ${errMsg} ${err.stack || util.inspect(err)}`));
    const bodyToSend = {
      error: errMsg,
    };
    res.status(err.status).set("X-Retraced-RequestId", reqId).json(bodyToSend);
  } else {
    // Generic error, default code (500).
    const bodyToSend = {
      error: err.message || "An unexpected error occurred",
    };
    console.log(chalk.red(`[${reqId}] !! 500 ${err.stack || err.message || util.inspect(err)}`));
    res.status(500).set("X-Retraced-RequestId", reqId).json(bodyToSend);
  }
};

export const preRequest = (req: express.Request, reqId: string) => {
  console.log(chalk.yellow(`[${reqId}] <- ${req.method} ${req.originalUrl}`));
  if (!_.isEmpty(req.body)) {
    let bodyString = JSON.stringify(req.body);
    if (bodyString.length > 512) {
      bodyString = `${bodyString.substring(0, 512)} (... truncated, total ${bodyString.length} bytes)`;
    }
    console.log(chalk.yellow(`[${reqId}] <- ${bodyString}`));
  }
};

export const requestId = (req: express.Request, handlerName: string) => {
  return `${handlerName}:${uuid.v4().replace("-", "").substring(0, 8)}`;
};

export const wrapRoute = (route, handlerName) =>
  (req: express.Request, res: express.Response) => {
    const reqId = requestId(req, handlerName);
    preRequest(req, reqId);
    route.handler(req)
      .then(onSuccess(res, reqId))
      .catch(onError(res, reqId));
};

export function register(route, handler, app) {
  // Register this route and callback with express.
  console.log(`[${route.method}] '${route.path}'`);
  if (route.method === "get") {
    app.get(route.path, handler);
  } else if (route.method === "post") {
    app.post(route.path, handler);
  } else if (route.method === "put") {
    app.put(route.path, handler);
  } else if (route.method === "delete") {
    app.delete(route.path, handler);
  } else {
    console.log(`Unhandled HTTP method: '${route.method}'`);
  }
}
