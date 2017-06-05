import { checkAdminAccess } from "../../security/helpers";
import createApiToken from "../../models/api_token/create";
import listApiTokens from "../../models/api_token/list";

export default async function (req) {
  await checkAdminAccess(req);

  await createApiToken(
    req.params.projectId,
    req.body.environment_id,
    {
      name: req.body.name,
      disabled: false,
    },
  );

  const apiTokens = listApiTokens({
    projectId: req.params.projectId,
  });

  return {
    status: 201,
    body: JSON.stringify({ apiTokens }),
  };
}
