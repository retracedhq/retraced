import { checkViewerAccess } from "../../security/helpers";
import createEitapiToken from "../../models/eitapi_token/create";

export default async function(req) {
  const claims = await checkViewerAccess(req);
  const result = await createEitapiToken({
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
