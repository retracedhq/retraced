import getApiToken from "../models/api_token/get";
import { apiTokenFromAuthHeader } from "../security/helpers";
import modelCreateViewerDescriptor from "../models/viewer_descriptor/create";
import { RawResponse, Responses } from "../router";

export interface ViewerToken {
  token: string;
}

export default async function handlerRaw(req): Promise<RawResponse> {
  const auth = req.get("Authorization");
  const projectId = req.params.projectId;
  const isAdmin = req.query.is_admin === "true";
  const groupId = req.query.group_id;
  const teamId = req.query.team_id;
  const targetId = req.query.target_id;
  const viewLogAction = req.query.view_log_action;
  const actorId = req.query.actor_id;
  const token: ViewerToken =
      await createViewerDescriptor(auth, projectId, isAdmin, actorId, groupId, teamId, targetId, viewLogAction);
  return Responses.created(token);
}

export async function createViewerDescriptor(
  auth: string,
  projectId: string,
  isAdmin: boolean,
  actorId: string,
  groupId?: string,
  teamId?: string,
  targetId?: string,
  viewLogAction?: string,
): Promise<ViewerToken> {
  groupId = groupId || teamId;
  if (!groupId) {
    throw { status: 400, err: new Error("Either group_id or team_id is required") };
  }

  const apiTokenId = apiTokenFromAuthHeader(auth);
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
    actorId,
    viewLogAction: viewLogAction || "audit.log.view",
  });

  return { token: newDesc.id };
}
