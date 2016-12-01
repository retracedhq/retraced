import * as _ from "lodash";

import validateSession from "../security/validateSession";
import checkAccess from "../security/checkAccess";
import getEvent from "../models/event/get";
import getActor from "../models/actor/get";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    const result = {};

    validateSession("admin", req.get("Authorization"))
      .then((claims) => {
        return checkAccess({
          user_id: claims.user_id,
          project_id: req.params.projectId,
        });
      })
      .then((valid) => {
        if (!valid) {
          reject({ status: 401, err: new Error("Unauthorized") });
          return;
        }
        return getEvent({
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
          event_id: req.params.eventId,
        });
      })
      .then((ev) => {
        result.event = ev;

        return getActor({
          actor_id: ev.actor_id,
        });
      })
      .then((actor) => {
        result.event.actor = actor;
        resolve({ event: result.event });
      })
      .catch(reject);
  });
};
