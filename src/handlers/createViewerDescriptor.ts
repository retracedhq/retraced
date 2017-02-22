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
    groupId: req.query.group_id,
    isAdmin: req.query.is_admin === "true",
  });

  // Clients will be expecting the response keys in snake_case
  const result = {
    project_id: newDesc.projectId,
    environment_id: newDesc.environmentId,
    group_id: newDesc.groupId,
    is_admin: newDesc.isAdmin,
  };

  return {
    status: 201,
    body: JSON.stringify({ token: result }),
  };
}
