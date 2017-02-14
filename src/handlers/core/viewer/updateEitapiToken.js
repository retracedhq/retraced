import validateSession from "../../../security/validateSession";
import updateEitapiToken from "../../../models/eitapi_token/update";

export default async function handler(req) {
  const authHeader = req.get("Authorization");
  const claims = await validateSession("viewer", authHeader);

  // We pass more than the id in here just to be safe.
  const result = await updateEitapiToken({
    eitapiTokenId: req.params.tokenId,
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
