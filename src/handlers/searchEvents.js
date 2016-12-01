import * as _ from "lodash";

import validateSession from "../security/validateSession";
import checkAccess from "../security/checkAccess";
import searchEvents from "../models/event/search";
import addDisplayTitles from "../models/event/addDisplayTitles";
import listActors from "../models/actor/list";
import listObjects from "../models/object/list";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    let result = {
      events: [],
      total_hits: 0,
    };

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
        return searchEvents({
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
          queries: req.body.queries,
        });
      })
      .then((events) => {
        result.events = events;
        result.total_hits = events.length;

        const actorIds = _.keys(_.countBy(result.events, "actor_id"));

        return listActors({
          project_id: req.params.projectId,
          environment_id: req.query.evironment_id,
          actorIds,
        });
      })
      .then((actors) => {
        const cleaned = _.map(result.events, (e) => {
          e.actor = _.find(actors, { id: e.actor_id });
          return e;
        });
        result.events = cleaned;

        const objectIds = _.keys(_.countBy(result.events, "object_id"));

        return listObjects({
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
          objectIds,
        });
      })
      .then((objects) => {
        const cleaned = _.map(result.events, (e) => {
          e.object = _.find(objects, { id: e.object_id });
          return e;
        });

        result.events = cleaned;

        return addDisplayTitles({
          events: result.events,
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
        });
      })
      .then((events) => {
        result.events = events;

        resolve({ result });
      })
      .catch(reject);
  });
};
