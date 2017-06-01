
import createEitapiToken from "../models/eitapi_token/create";
import Authenticator from "../security/Authenticator";
import { EnterpriseToken } from "../models/eitapi_token/index";

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
    const apiToken = await Authenticator.default().getApiTokenOr401(authorization, projectId);
    const result: EnterpriseToken = await createEitapiToken({
        projectId,
        groupId,
        environmentId: apiToken.environmentId,
        displayName: opts.display_name,
        viewLogAction: opts.view_log_action || "audit.log.view",
    });
    return {
        token: result.id,
        display_name: result.display_name,
        view_log_action: result.view_log_action,
    };
}
