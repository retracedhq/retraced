import getApiToken from "../models/api_token/get";
import { apiTokenFromAuthHeader } from "../security/helpers";
import modelCreateViewerDescriptor from "../models/viewer_descriptor/create";

export interface ViewerToken {
  token: string;
}

export default async function handlerRaw(req) {
  const auth = req.get("Authorization");
  const projectId = req.params.projectId;
  const groupId = req.query.group_id;
  const teamId = req.query.team_id;
  const isAdmin = req.query.is_admin === "true";
  const targetId = req.query.target_id;
  return createViewerDescriptor(auth, projectId, isAdmin, groupId, teamId, targetId);
}

export async function createViewerDescriptor(
  authorization: string,
  projectId: string,
  isAdmin: boolean,
  groupId?: string,
  teamId?: string,
  targetId?: string,
) {

  groupId = groupId || teamId;
  if (!groupId) {
    throw { status: 400, err: new Error("Either group_id or team_id is required") };
  }

  const apiTokenId = apiTokenFromAuthHeader(authorization);
  const apiToken: any = await getApiToken(apiTokenId);
  const validAccess = apiToken && apiToken.project_id === projectId;
  if (!validAccess) {
    throw { status: 401, err: new Error("Unauthorized") };
  }

  const newDesc = await modelCreateViewerDescriptor({
    projectId,
    environmentId: apiToken.environment_id,
    groupId,
    isAdmin,
    targetId,
  });

  return {
    status: 201,
    body: JSON.stringify({ token: newDesc.id }),
  };
}
