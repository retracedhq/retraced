import { checkViewerAccess } from "../../security/helpers";
import deleteEitapiToken from "../../models/eitapi_token/delete";
import { defaultEventCreater, CreateEventRequest } from "../createEvent";

export default async function (req) {
  const claims = await checkViewerAccess(req);

  // We pass more than the id in here just to be safe.
  await deleteEitapiToken({
    eitapiTokenId: req.params.tokenId,
    projectId: req.params.projectId,
    environmentId: claims.environmentId,
    groupId: claims.groupId,
  });

  const thisEvent: CreateEventRequest = {
    created: new Date(),
    action: "eitapi_token.delete",
    crud: "d",
    actor: {
      id: claims.actorId,
    },
    group: {
      id: claims.groupId,
    },
    target: {
      id: req.params.tokenId,
    },
    description: `Deleted an Enterprise IT Integration API Token`,
    source_ip: claims.ip,
  };
  await defaultEventCreater.saveRawEvent(claims.projectId, claims.environmentId, thisEvent);

  return {
    status: 204,
    body: "",
  };
}
