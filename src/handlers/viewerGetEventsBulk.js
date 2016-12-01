import * as _ from "lodash";

import * as validateSession from "../security/validateSession";
import * as  checkAccess from "../security/checkAccess";
import * as  getEventsBulk from "../models/event/getBulk";
import * as  getActors from "../models/actor/gets";
import * as  getObjects from "../models/object/gets";
import * as  addDisplayTitles from "../models/event/addDisplayTitles";

const handler = (req) => {
  return new Promise((resolve, reject) => {
    let events;
    let claims;

    validateSession("viewer", req.get("Authorization"))
      .then((c) => {
        claims = c;
        return getEventsBulk({
          project_id: req.params.projectId,
          environment_id: claims.environment_id,
          event_ids: req.body.event_ids,
        });
      })
      .then((ev) => {
        events = ev;
        let actorIds = _.map(events, (e) => {
          return e.actor ? e.actor.id : e.actor_id;
        });
        _.remove(actorIds, (a) => { _.isUndefined(a); });
        actorIds = _.uniq(actorIds);

        return getActors({
          actor_ids: actorIds,
        });
      })
      .then((actors) => {
        // TODO(zhaytee): This is pretty inefficient.
        _.forEach(events, (e) => {
          e.actor = _.find(actors, { id: e.actor ? e.actor.id : "" });
        });

        return getObjects({
          object_ids: _.map(events, (e) => {
            return e.object_id;
          }),
        });
      })
      .then((objects) => {
        // TODO this is pretty inefficient
        _.forEach(events, (e) => {
          e.object = _.find(objects, { id: e.object_id });
        });

        return addDisplayTitles({
          events: events,
          project_id: req.params.projectId,
          environment_id: claims.environment_id,
        });
      })
      .then((event) => {
        resolve({ events });
      })
      .catch(reject);
  });
};

module.exports = handler;
