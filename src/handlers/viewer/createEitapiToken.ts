import { checkViewerAccess } from "../../security/helpers";
import createEitapiToken from "../../models/eitapi_token/create";
import { defaultEventCreater, CreateEventRequest } from "../createEvent";

export default async function(req) {
  const claims = await checkViewerAccess(req);
  const result = await createEitapiToken({
    displayName: req.body.displayName,
    projectId: req.params.projectId,
    environmentId: claims.environmentId,
    groupId: claims.groupId,
    viewLogAction: claims.viewLogAction,
  });

  const thisEvent: CreateEventRequest = {
    action: "eitapi_token.create",
    crud: "c",
    actor: {
      id: claims.actorId,
    },
    group: {
      id: claims.groupId,
    },
    description: `Created an Enterprise IT Integration API Token`,
    source_ip: claims.ip,
  };
  await defaultEventCreater.saveRawEvent(
    claims.projectId,
    claims.environmentId,
    thisEvent,
  );

  return {
    status: 201,
    body: JSON.stringify(result),
  };
};
