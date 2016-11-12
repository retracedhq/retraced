"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
require("source-map-support/register");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const _ = require("lodash");
const uuid = require("uuid");
const chalk = require("chalk");
const routes_1 = require("./routes");
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
    app.get('/', (req, res) => {
        res.send('');
    });
    _.forOwn(routes_1.default, (route, handlerName) => {
        const routeCallback = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const reqId = `${handlerName}:${uuid.v4().replace('-', '').substring(0, 8)}`;
            console.log(chalk.yellow(`[${reqId}] <- ${req.method} ${req.originalUrl}`));
            if (!_.isEmpty(req.body)) {
                let bodyString = JSON.stringify(req.body);
                if (bodyString.length > 512) {
                    bodyString = `${bodyString.substring(0, 512)} (... truncated, total ${bodyString.length} bytes)`;
                }
                console.log(chalk.yellow(`[${reqId}] <- ${bodyString}`));
            }
            const handlerFunc = require(`./handlers/${handlerName}`);
            let result;
            try {
                result = yield handlerFunc(req);
            }
            catch (e) {
                if (e.status && e.err) {
                    console.log(chalk.red(`[${reqId}] !! ${e.status} ${e.err}`));
                    res.status(e.status).json(e.err);
                }
                else {
                    console.log(chalk.red(`[${reqId}] !! 500 ${e}`));
                    res.status(500).json(e);
                }
                return;
            }
            if (result.status && result.body) {
                let responseString = JSON.stringify(result.body);
                if (responseString.length > 512) {
                    responseString = `${responseString.substring(0, 512)} (... truncated, total ${responseString.length} bytes)`;
                }
                console.log(chalk.cyan(`[${reqId}] => ${result.code} ${responseString}`));
                res.status(result.status).json(result.body);
            }
            else {
                let responseString = JSON.stringify(result);
                if (responseString.length > 512) {
                    responseString = `${responseString.substring(0, 512)} (... truncated, total ${responseString.length} bytes)`;
                }
                console.log(chalk.cyan(`[${reqId}] => 200 ${responseString}`));
                res.status(200).json(result);
            }
        });
        console.log(`[${route.method}] '${route.path}'`);
        if (route.method === 'get') {
            app.get(route.path, routeCallback);
        }
        else if (route.method === 'post') {
            app.post(route.path, routeCallback);
        }
        else if (route.method === 'put') {
            app.put(route.path, routeCallback);
        }
        else {
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
//# sourceMappingURL=index.js.map