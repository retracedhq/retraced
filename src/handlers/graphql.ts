import "source-map-support/register";
import { graphql } from "graphql";

import { apiTokenFromAuthHeader } from "../security/helpers";
import Authenticator from "../security/Authenticator";
import getApiToken from "../models/api_token/get";
import { Scope } from "../security/scope";
import schema from "./graphql/schema";
import handler from "./graphql/handler";
import { GraphQLRequest, GraphQLResponse } from "./graphql/index";

export default async function(req) {
    const apiTokenId = apiTokenFromAuthHeader(req.get("Authorization"));
    const apiToken = await getApiToken(apiTokenId);
    if (!apiToken) {
        throw { status: 401, err: new Error("Unauthorized") };
    }

    return await handler(req, {
        projectId: apiToken.projectId,
        environmentId: apiToken.environmentId,
    });
}

export async function graphQL(
    authorization: string,
    projectId: string,
    graphQLReq: GraphQLRequest,
): Promise<GraphQLResponse> {
    const apiToken = await Authenticator.default().getApiTokenOr401(authorization, projectId);

    const context: Scope = {
        projectId: apiToken.projectId,
        environmentId: apiToken.environmentId,
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
