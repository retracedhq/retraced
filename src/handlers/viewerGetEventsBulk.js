import * as _ from "lodash";
import * as util from "util";

import validateSession from "../security/validateSession";
import checkAccess from "../security/checkAccess";
import getEventsBulk from "../models/event/getBulk";
import getActors from "../models/actor/gets";
import getObjects from "../models/object/gets";
import addDisplayTitles from "../models/event/addDisplayTitles";

export default async function handler(req) {
  const claims = await validateSession("viewer", req.get("Authorization"));

  const events = await getEventsBulk({
    project_id: req.params.projectId,
    environment_id: claims.environment_id,
    event_ids: req.body.event_ids,
  });

  let actorIds = _.map(events, (e) => {
    return e.actor ? e.actor.id : e.actor_id;
  });
  _.remove(actorIds, (a) => { _.isUndefined(a); });
  actorIds = _.uniq(actorIds);

  const actors = await getActors({
    actor_ids: actorIds,
  });
  for (const e of events) {
    e.actor = _.find(actors, { id: e.actor ? e.actor.id : e.actor_id });
  }

  const objects = await getObjects({
    object_ids: _.map(events, (e) => {
      return e.object_id;
    }),
  });
  for (const e of events) {
    e.object = _.find(objects, { id: e.object_id });
  }

  await addDisplayTitles({
    events: events,
    project_id: req.params.projectId,
    environment_id: claims.environment_id,
  });

  return events;
}
