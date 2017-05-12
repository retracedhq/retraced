import "source-map-support/register";

import { apiTokenFromAuthHeader } from "../security/helpers";
import getApiToken from "../models/api_token/get";
import handler from "./graphql/handler";

export default async function graphql(req) {
  const apiTokenId = apiTokenFromAuthHeader(req.get("Authorization"));
  const apiToken: any = await getApiToken(apiTokenId);

  return await handler(req, {
    projectId: apiToken.project_id,
    environmentId: apiToken.environment_id,
  });
}
