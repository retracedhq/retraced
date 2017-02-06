import validateSession from "../../../security/validateSession";
import createEitapiToken from "../../../models/eitapi_token/create";

export default async function handler(req) {
  const authHeader = req.get("Authorization");
  const claims = await validateSession("viewer", authHeader);
  const result = await createEitapiToken({
    displayName: req.body.displayName,
    projectId: req.params.projectId,
    environmentId: claims.environment_id,
    groupId: claims.group_id,
  });
  return {
    status: 201,
    body: JSON.stringify(result),
  };
};
