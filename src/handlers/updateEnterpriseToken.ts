import "source-map-support/register";
import getApiToken from "../models/api_token/get";
import modelsUpdateEnterpriseToken from "../models/eitapi_token/update";
import { apiTokenFromAuthHeader } from "../security/helpers";
import getPgPool from "../persistence/pg";
import { defaultEventCreater, CreateEventRequest } from "./createEvent";

const pgPool = getPgPool();

export async function updateEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    eitapiTokenId: string,
    displayName: string,
    viewLogAction: string | undefined,
    ip: string,
    route: string,
) {
    const apiTokenId = apiTokenFromAuthHeader(authorization);
    const apiToken: any = await getApiToken(apiTokenId, pgPool.query.bind(pgPool));
    const validAccess = apiToken && apiToken.project_id === projectId;

    if (!validAccess) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    const updated = await modelsUpdateEnterpriseToken({
        eitapiTokenId,
        projectId,
        groupId,
        displayName,
        viewLogAction,
        environmentId: apiToken.environment_id,
    });

    if (!updated) {
        throw {
            status: 404,
            err: new Error(`Not Found`),
        };
    }

    const thisEvent: CreateEventRequest = {
        action: "eitapi_token.update",
        crud: "u",
        actor: {
            id: "Publisher API",
            name: apiToken.name,
        },
        group: {
            id: groupId,
        },
        target: {
            id: eitapiTokenId,
        },
        description: route,
        source_ip: ip,
        fields: {
            displayName,
        },
    };
    if (viewLogAction) {
        thisEvent.fields!.viewLogAction = viewLogAction;
    }
    await defaultEventCreater.saveRawEvent(
        projectId,
        apiToken.environment_id,
        thisEvent,
    );

    return {
        status: 200,
        body: {
            token: updated.id,
            display_name: displayName,
            view_log_action: updated.view_log_action,
        },
    };
}
