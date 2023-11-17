import { graphql } from "graphql";

import { apiTokenFromAuthHeader } from "../security/helpers";
import Authenticator from "../security/Authenticator";
import getApiToken from "../models/api_token/get";
import { Scope } from "../security/scope";
import schema from "./graphql/schema";
import handler, { validateQuery } from "./graphql/handler";
import { GraphQLError, GraphQLRequest, GraphQLResp } from "./graphql/index";

export default async function (req) {
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
  graphQLReq: GraphQLRequest
): Promise<GraphQLResp> {
  const apiToken = await Authenticator.default().getApiTokenOr401(authorization, projectId);

  const context: Scope = {
    projectId: apiToken.projectId,
    environmentId: apiToken.environmentId,
  };
  const errors = validateQuery(graphQLReq.query, schema);
  if (errors.length > 0) {
    this.setStatus(400);
    return {
      errors: errors as GraphQLError[],
    };
  }
  return (await graphql({
    schema,
    source: graphQLReq.query,
    rootValue: null,
    contextValue: context,
    variableValues: graphQLReq.variables as { [variable: string]: unknown },
    operationName: graphQLReq.operationName,
  })) as GraphQLResp;
}
