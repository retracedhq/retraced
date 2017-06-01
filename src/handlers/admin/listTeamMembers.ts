import { checkAdminAccess } from "../../security/helpers";
import listTeamMembers from "../../models/team/listTeamMembers";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  const teamMembers = await listTeamMembers({
    projectId: req.params.projectId,
  });

  return {
    status: 200,
    body: JSON.stringify({ teamMembers }),
  };
}
