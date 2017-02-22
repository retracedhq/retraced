import { checkAdminAccess } from "../../security/helpers";
import getAction from "../../models/action/get";

export default async function (req) {
  checkAdminAccess(req);

  const action = await getAction({
    project_id: req.params.projectId,
    environment_id: req.query.environment_id,
    action_id: req.params.actionId,
  });

  return {
    status: 200,
    body: JSON.stringify({ action }),
  };
}
