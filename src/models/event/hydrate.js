import * as _ from "lodash";

import getActors from "../actor/gets";
import getTargets from "../target/gets";
import getGroups from "../group/gets";
import addDisplayTitles from "./addDisplayTitles";

// This is only for events coming from scylladb!
export default async function (opts) {
  const { eventsIn, projectId, environmentId, source } = opts;

  const events = [...eventsIn];

  let groupIds = _.map(events, (e) => {
    return e.team_id; // this is how the field is named in scylla
  });
  const groups = await getGroups({
    group_ids: groupIds,
  });
  for (const e of events) {
    e.group = _.find(groups, { id: e.team_id });
  }

  let actorIds = _.map(events, (e) => {
    return e.actor_id;
  });
  _.remove(actorIds, (a) => { _.isUndefined(a); });
  actorIds = _.uniq(actorIds);
  const actors = await getActors({
    actor_ids: actorIds,
  });
  for (const e of events) {
    e.actor = _.find(actors, { id: e.actor_id });
  }

  let targetIds = _.map(events, (e) => {
    return e.target_id;
  });
  _.remove(targetIds, (tid) => { _.isUndefined(tid); });
  targetIds = _.uniq(targetIds);
  const targets = await getTargets({
    target_ids: _.map(events, (e) => {
      return e.target_ids;
    }),
  });
  for (const e of events) {
    e.target = _.find(targets, { id: e.target_id });
  }

  await addDisplayTitles({
    events,
    project_id: projectId,
    environment_id: environmentId,
    source,
  });

  return events;
}
