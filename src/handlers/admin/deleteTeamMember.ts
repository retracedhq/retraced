import { checkAdminAccess } from "../../security/helpers";
import deleteTeamMember from "../../models/team/deleteMember";

export default async function(req) {
  await checkAdminAccess(req);

  await deleteTeamMember({
    projectId: req.params.projectId,
    userId: req.params.userId,
  });

  return {
    status: 204,
  };
}
