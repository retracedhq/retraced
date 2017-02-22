import { checkAdminAccess } from "../../security/helpers";
import getEventsBulk from "../../models/event/getBulk";
import hydrateScyllaEvents from "../../models/event/hydrate";

export default async function (req) {
  await checkAdminAccess(req);

  if (!req.query.environment_id) {
    throw { status: 400, err: new Error("Missing environment_id") };
  }

  let events = await getEventsBulk({
    project_id: req.params.projectId,
    environment_id: req.query.environment_id,
    event_ids: req.body.event_ids,
  });

  let hydratedEvents = await hydrateScyllaEvents({
    source: "admin",
    eventsIn: events,
    projectId: req.params.projectId,
    environmentId: req.query.environment_id,
  });

  return {
    status: 200,
    body: JSON.stringify({ events: hydratedEvents }),
  };
};
