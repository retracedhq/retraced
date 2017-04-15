import { checkAdminAccess } from "../../security/helpers";
import createApiToken from "../../models/api_token/create";
import listApiTokens from "../../models/api_token/list";

export default async function(req) {
  await checkAdminAccess(req);

  await createApiToken({
    project_id: req.params.projectId,
    name: req.body.name,
    environment_id: req.body.environment_id,
  });

  const apiTokens = listApiTokens({
    projectId: req.params.projectId,
  });

  return {
    status: 201,
    body: JSON.stringify({ apiTokens }),
  };
}
