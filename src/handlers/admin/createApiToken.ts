import { checkAdminAccess, checkAdminAccessUnwrapped } from "../../security/helpers";
import { ApiTokenValues } from "../../models/api_token";
import createApiToken from "../../models/api_token/create";
import listApiTokens from "../../models/api_token/list";

// for /v1/project/:projectId/token
export async function deprecated(req) {
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

export default async function createAPIToken(
    authorization: string,
    projectId: string,
    environmentId: string,
    token: string,
    values: ApiTokenValues,
) {
    await checkAdminAccessUnwrapped(authorization, projectId);

    return await createApiToken(
        projectId,
        environmentId,
        values,
        undefined,
        token,
    );
}
