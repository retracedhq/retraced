
import { checkAdminAccess } from "../../security/helpers";
import listInvites from "../../models/invite/list";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  const invites = await listInvites({
    projectId: req.params.projectId,
  });

  return {
    status: 200,
    body: JSON.stringify({ invites }),
  };
}
