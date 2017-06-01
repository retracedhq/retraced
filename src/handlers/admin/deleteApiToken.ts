import { checkAdminAccess } from "../../security/helpers";
import deleteApiToken from "../../models/api_token/delete";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  await deleteApiToken({
    projectId: req.params.projectId,
    tokenId: req.params.tokenId,
  });

  return {
    status: 204,
  };
}
