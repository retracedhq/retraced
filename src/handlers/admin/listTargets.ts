import { checkAdminAccess } from "../../security/helpers";
import listTargets from "../../models/target/list";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  const targets = await listTargets({
    projectId: req.params.projectId,
    environmentId: req.query.environment_id,
  });

  return {
    status: 200,
    body: JSON.stringify({ targets }),
  };
}
