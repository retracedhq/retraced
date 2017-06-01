import { checkAdminAccess } from "../../security/helpers";
import createInvite from "../../models/invite/create";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  const invite = await createInvite({
    email: req.body.email,
    project_id: req.params.projectId,
  });

  return {
    status: 201,
    body: JSON.stringify({ invite }),
  };
}
