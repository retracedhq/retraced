import { checkAdminAccessUnwrapped } from "../../security/helpers";
import { ApiTokenValues } from "../../models/api_token";
import createApiToken from "../../models/api_token/create";

export default async function createAPIToken(
  authorization: string,
  projectId: string,
  environmentId: string,
  token: string,
  values: ApiTokenValues
) {
  await checkAdminAccessUnwrapped(authorization, projectId);

  return await createApiToken(
    projectId,
    environmentId,
    values,
    undefined,
    token
  );
}
