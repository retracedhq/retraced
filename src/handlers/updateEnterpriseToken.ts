import "source-map-support/register";
import modelsUpdateEnterpriseToken from "../models/eitapi_token/update";
import Authenticator from "../security/Authenticator";
import { EnterpriseTokenResponse } from "./createEnterpriseToken";

export async function updateEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    eitapiTokenId: string,
    displayName: string,
    viewLogAction: string | undefined,
): Promise<EnterpriseTokenResponse> {
    const apiToken = await Authenticator.default().getApiTokenOr401(authorization, projectId);

    const updated = await modelsUpdateEnterpriseToken({
        eitapiTokenId,
        projectId,
        groupId,
        displayName,
        viewLogAction,
        environmentId: apiToken.environmentId,
    });

    if (!updated) {
        throw {
            status: 404,
            err: new Error(`Not Found`),
        };
    }

    return {
        token: updated.id,
        display_name: displayName,
        view_log_action: updated.view_log_action,
    };
}
