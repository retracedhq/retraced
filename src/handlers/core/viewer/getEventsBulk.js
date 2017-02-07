import "source-map-support/register";
import validateSession from "../../../security/validateSession";
import checkAccess from "../../../security/checkAccess";
import getEventsBulk from "../../../models/event/getBulk";
import renderEvents from "../../../models/event/render";

export default async function handler(req) {
  const claims = await validateSession("viewer", req.get("Authorization"));

  const events = await getEventsBulk({
    project_id: req.params.projectId,
    environment_id: claims.environment_id,
    event_ids: req.body.event_ids,
  });

  let renderedEvents = await renderEvents({
    source: "viewer",
    eventsIn: events,
    projectId: req.params.projectId,
    environmentId: claims.environment_id,
  });

  return {
    status: 200,
    body: JSON.stringify(renderedEvents),
  };
}
