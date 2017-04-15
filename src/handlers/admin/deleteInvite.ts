import { checkAdminAccess } from "../../security/helpers";
import deleteInvite from "../../models/invite/delete";

export default async function(req) {
  await checkAdminAccess(req);

  await deleteInvite({
    projectId: req.params.projectId,
    inviteId: req.params.inviteId,
  });

  return {
    status: 204,
  };
}
