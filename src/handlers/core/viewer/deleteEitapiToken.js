import "source-map-support/register";
import validateSession from "../../../security/validateSession";
import deleteEitapiToken from "../../../models/eitapi_token/delete";

export default async function handler(req) {
  const authHeader = req.get("Authorization");
  const claims = await validateSession("viewer", authHeader);

  // We pass more than the id in here just to be safe.
  await deleteEitapiToken({
    eitapiTokenId: req.params.tokenId,
    projectId: req.params.projectId,
    environmentId: claims.environment_id,
    groupId: claims.group_id,
  });
  return {
    status: 204,
    body: "",
  };
};
