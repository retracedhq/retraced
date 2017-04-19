import getApiToken from "../models/api_token/get";
import uniqueId from "../models/uniqueId";
import modelsDeleteEnterpriseToken from "../models/eitapi_token/delete";
import { apiTokenFromAuthHeader } from "../security/helpers";

export async function deleteEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    eitapiTokenId: string,
) {
    const apiTokenId = apiTokenFromAuthHeader(authorization);
    const apiToken: any = await getApiToken(apiTokenId, this.pgPool.query.bind(this.pgPool));
    const validAccess = apiToken && apiToken.project_id === projectId;

    if (!validAccess) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    const result = await modelsDeleteEnterpriseToken({
        projectId,
        groupId,
        eitapiTokenId,
        environmentId: apiToken.environment_id,
    });

    return { status: 204 };
}
