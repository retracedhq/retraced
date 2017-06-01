import { checkAdminAccess } from "../../security/helpers";
import deleteTeamMember from "../../models/team/deleteMember";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  await deleteTeamMember({
    projectId: req.params.projectId,
    userId: req.params.userId,
  });

  return {
    status: 204,
  };
}
