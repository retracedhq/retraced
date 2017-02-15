import validateSession from "../../security/validateSession";
import checkAccess from "../../security/checkAccess";
import getEventsBulk from "../../models/event/getBulk";
import hydrateScyllaEvents from "../../models/event/hydrate";

export default async function handler(req) {
  if (!req.query.environment_id) {
    reject({ status: 400, err: new Error("Missing environment_id") });
    return;
  }

  const claims = await validateSession("admin", req.get("Authorization"));

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
