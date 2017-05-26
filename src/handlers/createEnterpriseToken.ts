
import getApiToken from "../models/api_token/get";
import createEitapiToken from "../models/eitapi_token/create";
import { apiTokenFromAuthHeader } from "../security/helpers";
import getPgPool from "../persistence/pg";
import { EnterpriseToken } from "../models/eitapi_token/index";

const pgPool = getPgPool();

export interface CreateEnterpriseTokenRequest {
    /** the display name for the token */
    display_name: string;
    /** The `action` name that will be used to record usages of this token. Defaults to `audit.log.view` */
    view_log_action?: string;
}

export interface EnterpriseTokenResponse {
    /** The token that was created */
    token: string;
    /** the display name for the token */
    display_name: string;
    /** The `action` name that will be used to record usages of this token. Defaults to `audit.log.view` */
    view_log_action?: string;
}

export async function createEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    opts: CreateEnterpriseTokenRequest,
): Promise<EnterpriseTokenResponse> {
    console.log(authorization, projectId, groupId, opts);
    const apiTokenId = apiTokenFromAuthHeader(authorization);
    const apiToken: any = await getApiToken(apiTokenId, pgPool.query.bind(pgPool));
    const validAccess = apiToken && apiToken.project_id === projectId;

    if (!validAccess) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    const result: EnterpriseToken = await createEitapiToken({
        projectId,
        groupId,
        environmentId: apiToken.environment_id,
        displayName: opts.display_name,
        viewLogAction: opts.view_log_action || "audit.log.view",
    });
    return {
      token: result.id,
      display_name: result.display_name,
      view_log_action: result.view_log_action,
    };
}
