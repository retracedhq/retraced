import "source-map-support/register";
import { checkEitapiAccess } from "../../security/helpers";
import { defaultEventCreater, CreateEventRequest } from "../createEvent";

import handler from "../graphql/handler";

export default async function(req) {
  const eitapiToken = await checkEitapiAccess(req);

  const results = await handler(req, {
    projectId: eitapiToken.project_id,
    environmentId: eitapiToken.environment_id,
    groupId: eitapiToken.group_id,
  });

  const thisViewEvent: CreateEventRequest = {
    action: eitapiToken.viewLogAction,
    crud: "r",
    is_anonymous: true,
    group: {
      id: eitapiToken.group_id,
    },
    description: `${req.method} ${req.originalUrl}`,
    source_ip: req.ip,
  };
  defaultEventCreater.saveRawEvent(
    eitapiToken.project_id,
    eitapiToken.environment_id,
    thisViewEvent,
  );

  return results;
}
