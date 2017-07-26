import { checkAdminAccessUnwrapped } from "../../security/helpers";
import deleteInviteModel from "../../models/invite/delete";

export async function deprecated(req) {
  await deleteInvite(
    req.get("Authorization"),
    req.params.projectId,
    req.params.inviteId,
  );

  return {
    status: 204,
  };
}

export default async function deleteInvite(
  auth: string,
  projectId: string,
  inviteId: string,
): Promise<void> {
  await checkAdminAccessUnwrapped(auth, projectId);

  return await deleteInviteModel({
    inviteId,
    projectId,
  });
}
