import { checkViewerAccess } from "../../security/helpers";
import deleteEitapiToken from "../../models/eitapi_token/delete";

export default async function (req) {
  const claims = await checkViewerAccess(req);

  // We pass more than the id in here just to be safe.
  await deleteEitapiToken({
    eitapiTokenId: req.params.tokenId,
    projectId: req.params.projectId,
    environmentId: claims.environmentId,
    groupId: claims.groupId,
  });
  return {
    status: 204,
    body: "",
  };
};
