import "source-map-support/register";
import getApiToken from "../models/api_token/get";
import { apiTokenFromAuthHeader } from "../security/helpers";
import modelsListEnterpriseTokens from "../models/eitapi_token/list";
import { EnterpriseTokenResponse } from "./createEnterpriseToken";

export async function listEnterpriseTokens(
  authorization: string,
  projectId: string,
  groupId: string,
): Promise<EnterpriseTokenResponse[]> {
  const apiTokenId = apiTokenFromAuthHeader(authorization);
  const apiToken: any = await getApiToken(apiTokenId);
  const validAccess = apiToken && apiToken.project_id === projectId;

  if (!validAccess) {
    throw { status: 401, err: new Error("Unauthorized") };
  }

  const tokens: EnterpriseTokenResponse[] = (await modelsListEnterpriseTokens({
      projectId,
      groupId,
      environmentId: apiToken.environment_id,
    }))
    .map(({ id, display_name}) => {
      return {
        token: id,
        display_name,
      };
    });

  return tokens;
}
