import "source-map-support/register";
import modelsGetEnterpriseToken from "../models/eitapi_token/get";
import Authenticator from "../security/Authenticator";
import { EnterpriseTokenResponse } from "./createEnterpriseToken";

export async function getEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    eitapiTokenId: string,
): Promise<EnterpriseTokenResponse> {
    const apiToken = await Authenticator.default().getApiTokenOr401(authorization, projectId);

    const token = await modelsGetEnterpriseToken({
        eitapiTokenId,
    });

    if (!token) {
        throw { status: 404, err: new Error("Not Found") };
    }
    if (token.project_id !== apiToken.projectId) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    return {
        token: token.id,
        display_name: token.display_name,
        view_log_action: token.view_log_action,
    };
}
