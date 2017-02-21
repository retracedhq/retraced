import * as _ from "lodash";

import { checkAdminAccess } from "../../security/helpers";
import getEvent from "../../models/event/get";
import getActor from "../../models/actor/get";
import hydrateScyllaEvents from "../../models/event/hydrate";

export default async function (req) {
  await checkAdminAccess(req);

  const event = await getEvent({
    project_id: req.params.projectId,
    environment_id: req.query.environment_id,
    event_id: req.params.eventId,
  });

  let hydratedEvents = await hydrateScyllaEvents({
    source: "admin",
    eventsIn: [event],
    projectId: req.params.projectId,
    environmentId: req.query.environment_id,
  });

  return {
    status: 200,
    body: JSON.stringify({ event: hydratedEvents[0] }),
  };
}
