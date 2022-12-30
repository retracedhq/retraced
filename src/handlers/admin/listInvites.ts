import { checkAdminAccessUnwrapped } from "../../security/helpers";
import listInviteModels from "../../models/invite/list";
import { Invite } from "../../models/invite";

export default async function listInvites(
  auth: string,
  projectId: string
): Promise<Invite[]> {
  await checkAdminAccessUnwrapped(auth, projectId);

  return await listInviteModels({ projectId });
}
