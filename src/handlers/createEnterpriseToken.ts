
import getApiToken from "../models/api_token/get";
import createEitapiToken from "../models/eitapi_token/create";
import { apiTokenFromAuthHeader } from "../security/helpers";
import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export interface CreateEnterpriseToken {
    displayName: string;
    viewLogAction?: string;
}

export interface EnterpriseToken {
    token: string;
    display_name: string;
    view_log_action?: string;
}

export async function createEnterpriseToken(
    authorization: string,
    projectId: string,
    groupId: string,
    opts: CreateEnterpriseToken,
): Promise<EnterpriseToken> {
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

   return body;
}
