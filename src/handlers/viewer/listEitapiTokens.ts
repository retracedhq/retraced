import { checkViewerAccess } from "../../security/helpers";
import listEitapiTokens from "../../models/eitapi_token/list";

export default async function (req) {
  const claims = await checkViewerAccess(req);
  const list = await listEitapiTokens({
    projectId: req.params.projectId,
    environmentId: claims.environmentId,
    groupId: claims.groupId,
  });
  return {
    status: 200,
    body: JSON.stringify(list),
  };
};
