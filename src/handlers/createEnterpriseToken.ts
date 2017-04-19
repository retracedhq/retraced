import getApiToken from "../models/api_token/get";
import uniqueId from "../models/uniqueId";
import createEitapiToken from "../models/eitapi_token/create";
import { apiTokenFromAuthHeader } from "../security/helpers";

export interface CreateEnterpriseToken {
    displayName: string;
}

export interface EnterpriseToken {
    token: string;
}

export async function createEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    opts: CreateEnterpriseToken,
) {
    const apiTokenId = apiTokenFromAuthHeader(authorization);
    const apiToken: any = await getApiToken(apiTokenId, this.pgPool.query.bind(this.pgPool));
    const validAccess = apiToken && apiToken.project_id === projectId;

    if (!validAccess) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    const result = await createEitapiToken({
        projectId,
        groupId,
        environmentId: apiToken.environment_id,
        displayName: opts.displayName,
    });

    return {
        status: 201,
        body: result,
    };
}
