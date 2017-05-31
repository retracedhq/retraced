import "source-map-support/register";
import { graphql } from "graphql";

import getPgPool from "../persistence/pg";
import { apiTokenFromAuthHeader } from "../security/helpers";
import getApiToken from "../models/api_token/get";
import { Scope } from "../security/scope";
import schema from "./graphql/schema";
import handler from "./graphql/handler";
import { GraphQLRequest, GraphQLResponse } from "./graphql/index";

const pgPool = getPgPool();

export default async function(req) {
    const apiTokenId = apiTokenFromAuthHeader(req.get("Authorization"));
    const apiToken: any = await getApiToken(apiTokenId);

    return await handler(req, {
        projectId: apiToken.project_id,
        environmentId: apiToken.environment_id,
    });
}

export async function graphQL(
    authorization: string,
    projectId: string,
    graphQLReq: GraphQLRequest,
): Promise<GraphQLResponse> {
    const apiTokenId = apiTokenFromAuthHeader(authorization);
    const apiToken: any = await getApiToken(apiTokenId, pgPool);
    const validAccess = apiToken && apiToken.project_id === projectId;

    if (!validAccess) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    const context: Scope = {
        projectId: apiToken.project_id,
        environmentId: apiToken.environment_id,
    };

    // http://graphql.org/graphql-js/graphql/#graphql
    return await graphql(
        schema,
        graphQLReq.query,
        null,
        context,
        graphQLReq.variables,
        graphQLReq.operationName,
    );
}
