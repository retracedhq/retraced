import { checkViewerAccess } from "../../security/helpers";
import updateEitapiToken from "../../models/eitapi_token/update";

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
  return {
    status: 201,
    body: JSON.stringify(result),
  };
};
