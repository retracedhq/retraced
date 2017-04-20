import * as _ from "lodash";
import getApiToken from "../models/api_token/get";
import uniqueId from "../models/uniqueId";
import createEitapiToken from "../models/eitapi_token/create";
import { apiTokenFromAuthHeader } from "../security/helpers";
import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export interface CreateEnterpriseToken {
    displayName: string;
}

export interface EnterpriseToken {
    token: string;
    display_name: string;
}

export async function createEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    opts: CreateEnterpriseToken,
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
    });
    const body = {
      token: result.id,
      display_name: result.display_name,
    };

    return {
        status: 201,
        body,
    };
}
