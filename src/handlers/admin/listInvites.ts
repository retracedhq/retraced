import { checkAdminAccessUnwrapped } from "../../security/helpers";
import listInviteModels from "../../models/invite/list";
import { Invite } from "../../models/invite";

export async function deprecated(req) {
  let invites: any[] = await listInvites(
    req.get("Authorization"),
    req.params.projectId,
  );

  invites = invites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    project_id: invite.project_id,
    created: invite.valueOf(),
  }));

  return {
    status: 200,
    body: JSON.stringify({
      invites: invites.length ? invites : null,
    }),
  };
}

export default async function listInvites(
  auth: string,
  projectId: string,
): Promise<Invite[]> {
  await checkAdminAccessUnwrapped(auth, projectId);

  return await listInviteModels({ projectId});
}
