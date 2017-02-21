import { checkViewerAccess } from "../../security/helpers";
import getEventsBulk from "../../models/event/getBulk";
import hydrateScyllaEvents from "../../models/event/hydrate";

export default async function (req) {
  const claims = await checkViewerAccess(req);

  const events = await getEventsBulk({
    project_id: req.params.projectId,
    environment_id: claims.environmentId,
    event_ids: req.body.event_ids,
  });

  let hydratedEvents = await hydrateScyllaEvents({
    source: "viewer",
    eventsIn: events,
    projectId: req.params.projectId,
    environmentId: claims.environmentId,
  });

  return {
    status: 200,
    body: JSON.stringify(hydratedEvents),
  };
}
