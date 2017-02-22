import { checkAdminAccess } from "../../security/helpers";
import listActions from "../../models/action/list";

export default async function (req) {
  await checkAdminAccess(req);

  const actions = await listActions({
    project_id: req.params.projectId,
    environment_id: req.query.environment_id,
  });

  return {
    status: 200,
    body: JSON.stringify({ actions }),
  };
}
