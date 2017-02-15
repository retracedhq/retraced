import * as _ from "lodash";

import validateSession from "../../security/validateSession";
import checkAccess from "../../security/checkAccess";
import getEvent from "../../models/event/get";
import getActor from "../../models/actor/get";
import hydrateScyllaEvents from "../../models/event/hydrate";

export default async function handler(req) {
  const claims = await validateSession("admin", req.get("Authorization"));
  const validAccess = await checkAccess({
    user_id: claims.user_id,
    project_id: req.params.projectId,
  });
  if (!validAccess) {
    return {
      status: 401,
      body: "Unauthorized",
    };
  }

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
