import { checkAdminAccess } from "../../security/helpers";
import listTeamMembers from "../../models/team/listTeamMembers";

export default async function(req) {
  await checkAdminAccess(req);

  const teamMembers = await listTeamMembers({
    projectId: req.params.projectId,
  });

  return {
    status: 200,
    body: JSON.stringify({ teamMembers }),
  };
}
