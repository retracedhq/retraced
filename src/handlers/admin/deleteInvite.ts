import { checkAdminAccessUnwrapped } from "../../security/helpers";
import deleteInviteModel from "../../models/invite/delete";

export default async function deleteInvite(
  auth: string,
  projectId: string,
  inviteId: string
): Promise<void> {
  await checkAdminAccessUnwrapped(auth, projectId);

  return await deleteInviteModel({
    inviteId,
    projectId,
  });
}
