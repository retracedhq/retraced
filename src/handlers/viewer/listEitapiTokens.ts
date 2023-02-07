import { checkViewerAccess } from "../../security/helpers";
import listEitapiTokens from "../../models/eitapi_token/list";
import { defaultEventCreater, CreateEventRequest } from "../createEvent";

export default async function (req) {
  const claims = await checkViewerAccess(req);
  const list = await listEitapiTokens({
    projectId: req.params.projectId,
    environmentId: claims.environmentId,
    groupId: claims.groupId,
  });

  const thisEvent: CreateEventRequest = {
    created: new Date(),
    action: "eitapi_tokens.list",
    crud: "r",
    actor: {
      id: claims.actorId,
    },
    group: {
      id: claims.groupId,
    },
    description: `Listed Enterprise IT Integration API Tokens`,
    source_ip: claims.ip,
  };
  await defaultEventCreater.saveRawEvent(claims.projectId, claims.environmentId, thisEvent);

  return {
    status: 200,
    body: JSON.stringify(list),
  };
}
