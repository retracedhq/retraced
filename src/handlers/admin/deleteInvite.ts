import { checkAdminAccess } from "../../security/helpers";
import deleteInvite from "../../models/invite/delete";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  await deleteInvite({
    projectId: req.params.projectId,
    inviteId: req.params.inviteId,
  });

  return {
    status: 204,
  };
}
