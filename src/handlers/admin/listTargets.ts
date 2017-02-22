import { checkAdminAccess } from "../../security/helpers";
import listTargets from "../../models/target/list";

export default async function (req) {
  await checkAdminAccess(req);

  const targets = await listTargets({
    project_id: req.params.projectId,
    environment_id: req.query.environment_id,
  });

  return {
    status: 200,
    body: JSON.stringify({ targets }),
  };
}
