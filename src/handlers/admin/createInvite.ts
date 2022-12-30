import { checkAdminAccessUnwrapped } from "../../security/helpers";
import { Invite } from "../../models/invite";
import createInviteModel from "../../models/invite/create";
import nsq from "../../persistence/nsq";
import config from "../../config";

export default async function createInvite(
  auth: string,
  projectId: string,
  email: string,
  id?: string
): Promise<Invite> {
  await checkAdminAccessUnwrapped(auth, projectId);

  const invite = await createInviteModel({
    project_id: projectId,
    email,
    id,
  });

  // Send the email
  await nsq.produce(
    "emails",
    JSON.stringify({
      to: invite.email,
      subject: "You have been invited to join a group on Retraced.",
      template: "retraced/invite-to-team",
      context: {
        invite_url: `${config.RETRACED_APP_BASE}/invitations/${invite.id}`,
      },
    })
  );

  return invite;
}
