import "source-map-support/register";
import validateSession from "../../../security/validateSession";
import listEitapiTokens from "../../../models/eitapi_token/list";

export default async function handler(req) {
  const authHeader = req.get("Authorization");
  const claims = await validateSession("viewer", authHeader);
  const list = await listEitapiTokens({
    projectId: req.params.projectId,
    environmentId: claims.environment_id,
    groupId: claims.group_id,
  });
  return {
    status: 200,
    body: JSON.stringify(list),
  };
};
