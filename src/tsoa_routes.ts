import * as _ from "lodash";
import * as bugsnag from "bugsnag";
import * as chalk from "chalk";
import * as express from "express";
import * as util from "util";
import * as uuid from "uuid";

import { Controller } from "tsoa";

import { PublisherController } from "./controllers/PublisherController";
import { defaultEventCreater } from "./handlers/createEvent";
import { wrapRoute, register, requestId, preRequest, onSuccess, onError } from "./router";

interface TSOARoute {
  path: string;
  method: string;
  controller: object;
  controllerMethod: (...args: any[]) => any;
  argsFrom: (request: express.Request) => any[];
}

interface TSOARoutes {
  [name: string]: TSOARoute;
}

export function TSOARoutes(publisherController?: PublisherController): TSOARoutes {
  publisherController = publisherController || new PublisherController(defaultEventCreater);
  return {
    createEvent: {
      path: "/v1/project/:projectId/event",
      method: "post",
      controller: publisherController,
      controllerMethod: publisherController.createEvent,
      argsFrom: (request: express.Request) => [request.get("Authorization"), request.params.projectId, request.body],
    },
    publisherCreatedEvent: {
      path: "/publisher/v1/project/:projectId/event",
      method: "post",
      controller: publisherController,
      controllerMethod: publisherController.createEvent,
      argsFrom: (request: express.Request) => [request.get("Authorization"), request.params.projectId, request.body],
    },
  };
}

export const wrapTSOARoute = (route: TSOARoute, handlerName: string) =>
  (request: express.Request, response: any, next: any) => {

    const reqId = requestId(request, handlerName);
    preRequest(request, reqId);

    const promise = route.controllerMethod.apply(route.controller, route.argsFrom(request));
    let statusCode: number | undefined;
    if (route.controller instanceof Controller) {
      statusCode = (route.controller as Controller).getStatus();
    }

    promise
      .then(onSuccess(response, reqId, statusCode))
      .catch(onError(response, reqId));
  };
