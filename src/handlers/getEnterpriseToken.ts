import "source-map-support/register";
import getApiToken from "../models/api_token/get";
import modelsGetEnterpriseToken from "../models/eitapi_token/get";
import { apiTokenFromAuthHeader } from "../security/helpers";
import getPgPool from "../persistence/pg";
import { EnterpriseTokenResponse } from "./createEnterpriseToken";

const pgPool = getPgPool();

export async function getEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    eitapiTokenId: string,
): Promise<EnterpriseTokenResponse> {
    const apiTokenId = apiTokenFromAuthHeader(authorization);
    const apiToken: any = await getApiToken(apiTokenId, pgPool.query.bind(pgPool));
    const validAccess = apiToken && apiToken.project_id === projectId;

    if (!validAccess) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    const token = await modelsGetEnterpriseToken({
        eitapiTokenId,
    });

    if (!token) {
        throw { status: 404, err: new Error("Not Found") };
    }
    if (token.project_id !== apiToken.project_id) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    return {
        token: token.id,
        display_name: token.display_name,
        view_log_action: token.view_log_action,
    };
}
