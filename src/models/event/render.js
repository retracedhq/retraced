import * as _ from "lodash";

import getActors from "../actor/gets";
import getObjects from "../object/gets";
import addDisplayTitles from "./addDisplayTitles";

export default async function renderEvents(opts) {
  const { eventsIn, projectId, environmentId, source } = opts;

  const events = [...eventsIn];

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
    events,
    project_id: projectId,
    environment_id: environmentId,
    source,
  });

  return events;
}
