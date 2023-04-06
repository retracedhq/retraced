import { checkAdminAccessUnwrapped } from "../../security/helpers";
import { Invite } from "../../models/invite";
import createInviteModel from "../../models/invite/create";
import config from "../../config";
import { temporalClient } from "../../_processor/persistence/temporal";
import { sendEmailWorkflow } from "../../_processor/temporal/workflows/sendEmailWorkflow";

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

  const job = {
    to: invite.email,
    subject: "You have been invited to join a group on Retraced.",
    template: "retraced/invite-to-team",
    context: {
      invite_url: `${config.RETRACED_APP_BASE}/invitations/${invite.id}`,
    },
  };

  // Send the email
  await temporalClient.start(sendEmailWorkflow, {
    workflowId: invite.id,
    taskQueue: "events",
    args: [job],
  });

  return invite;
}
