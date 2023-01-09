import modelsDeleteEnterpriseToken from "../models/eitapi_token/delete";
import Authenticator from "../security/Authenticator";

export async function deleteEnterpriseToken(
  authorization: string,
  projectId: string,
  groupId: string,
  eitapiTokenId: string
) {
  const apiToken = await Authenticator.default().getApiTokenOr401(
    authorization,
    projectId
  );

  const wasDeleted = await modelsDeleteEnterpriseToken({
    projectId,
    groupId,
    eitapiTokenId,
    environmentId: apiToken.environmentId,
  });

  if (!wasDeleted) {
    throw {
      status: 404,
      err: new Error(`Not Found`),
    };
  }
}
