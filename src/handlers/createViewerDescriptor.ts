import getApiToken from "../models/api_token/get";
import { apiTokenFromAuthHeader } from "../security/helpers";
import createViewerDescriptor from "../models/viewer_descriptor/create";
import verifyProjectAccess from "../security/verifyProjectAccess";

export default async function handler(req) {
  const apiTokenId = apiTokenFromAuthHeader(req.get("Authorization"));
  const apiToken: any = await getApiToken(apiTokenId);
  const validAccess = await verifyProjectAccess({
    apiToken: apiToken.token,
    projectId: req.params.projectId,
  });
  if (!validAccess) {
    throw { status: 401, err: new Error("Unauthorized") };
  }

  const newDesc = await createViewerDescriptor({
    projectId: req.params.projectId,
    environmentId: apiToken.environment_id,
    groupId: req.query.group_id || req.query.team_id,
    isAdmin: req.query.is_admin === "true",
  });

  // This should probably be a 201, but current clients are expecting 200.
  return {
    status: 200,
    body: JSON.stringify({ token: newDesc.id }),
  };
}
