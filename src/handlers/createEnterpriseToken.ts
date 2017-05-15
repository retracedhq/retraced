import * as _ from "lodash";
import getApiToken from "../models/api_token/get";
import uniqueId from "../models/uniqueId";
import createEitapiToken from "../models/eitapi_token/create";
import { apiTokenFromAuthHeader } from "../security/helpers";
import getPgPool from "../persistence/pg";
import { defaultEventCreater, CreateEventRequest } from "./createEvent";

const pgPool = getPgPool();

export interface CreateEnterpriseToken {
    displayName: string;
    viewLogAction?: string;
}

export interface EnterpriseToken {
    token: string;
    display_name: string;
    view_log_action: string;
}

export async function createEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    opts: CreateEnterpriseToken,
    ip: string,
    route: string,
) {
    const apiTokenId = apiTokenFromAuthHeader(authorization);
    const apiToken: any = await getApiToken(apiTokenId, pgPool.query.bind(pgPool));
    const validAccess = apiToken && apiToken.project_id === projectId;

    if (!validAccess) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    const result = await createEitapiToken({
        projectId,
        groupId,
        environmentId: apiToken.environment_id,
        displayName: opts.displayName,
        viewLogAction: opts.viewLogAction || "audit.log.view",
    });
    const body = {
      token: result.id,
      display_name: result.display_name,
      view_log_action: result.view_log_action,
    };

    const thisEvent: CreateEventRequest = {
        action: "eitapi_token.create",
        crud: "c",
        actor: {
            id: "Publisher API",
            name: apiToken.name,
        },
        group: {
            id: groupId,
        },
        description: route,
        source_ip: ip,
    };
    await defaultEventCreater.saveRawEvent(
        projectId,
        apiToken.environment_id,
        thisEvent,
    );

    return {
        status: 201,
        body,
    };
}
