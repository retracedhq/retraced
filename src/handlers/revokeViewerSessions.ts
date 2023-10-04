import Authenticator from "../security/Authenticator";
import modelDeleteViewerDescriptors from "../models/viewer_descriptor/delete";
import { RawResponse } from "../router";

export default async function handlerRaw(req): Promise<RawResponse> {
  const auth = req.get("Authorization");
  const projectId = req.params.projectId;
  const groupId = req.params.groupId;
  const actorId = req.params.actorId;
  await revokeViewerSessions(auth, projectId, actorId, groupId);
  return {
      status: 200,
      body: "",
  };
}

export async function revokeViewerSessions(
  auth: string,
  projectId: string,
  actorId: string,
  groupId: string,
): Promise<void> {

  const apiToken = await Authenticator.default().getApiTokenOr401(auth, projectId);

  await modelDeleteViewerDescriptors({
    projectId,
    environmentId: apiToken.environmentId,
    groupId,
    actorId,
  });
}
