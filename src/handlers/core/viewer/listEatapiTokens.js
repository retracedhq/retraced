import validateSession from "../../../security/validateSession";
import listEatapiTokens from "../../../models/eatapi_token/list";

export default async function handler(req) {
  const authHeader = req.get("Authorization");
  const claims = await validateSession("viewer", authHeader);
  const list = await listEatapiTokens({
    projectId: req.params.projectId,
    environmentId: claims.environment_id,
    groupId: claims.group_id,
  });
  return {
    status: 200,
    body: JSON.stringify(list),
  };
};
