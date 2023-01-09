import Authenticator from "../security/Authenticator";
import modelsListEnterpriseTokens from "../models/eitapi_token/list";
import { EnterpriseTokenResponse } from "./createEnterpriseToken";

export async function listEnterpriseTokens(
  authorization: string,
  projectId: string,
  groupId: string
): Promise<EnterpriseTokenResponse[]> {
  const apiToken = await Authenticator.default().getApiTokenOr401(
    authorization,
    projectId
  );

  const tokens: EnterpriseTokenResponse[] = (
    await modelsListEnterpriseTokens({
      projectId,
      groupId,
      environmentId: apiToken.environmentId,
    })
  ).map(({ id, display_name }) => {
    return {
      token: id,
      display_name,
    };
  });

  return tokens;
}
