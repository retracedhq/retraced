import { checkViewerAccess } from "../../security/helpers";
import updateEitapiToken from "../../models/eitapi_token/update";
import { defaultEventCreater, CreateEventRequest } from "../createEvent";

// Only displayName can be updated. Viewers cannot change viewLogAction.
export default async function(req) {
  const claims = await checkViewerAccess(req);

  // We pass more than the id in here just to be safe.
  const result = await updateEitapiToken({
    eitapiTokenId: req.params.tokenId,
    displayName: req.body.displayName,
    projectId: req.params.projectId,
    environmentId: claims.environmentId,
    groupId: claims.groupId,
  });

  const thisEvent: CreateEventRequest = {
    action: "eitapi_token.update",
    crud: "u",
    actor: {
      id: claims.actorId,
    },
    group: {
      id: claims.groupId,
    },
    target: {
      id: req.params.tokenId,
    },
    description: `${req.method} ${req.originalUrl}`,
    source_ip: claims.ip,
    fields: {
      displayName: req.body.displayName,
    },
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
