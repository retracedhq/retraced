import { checkAdminAccess } from "../../security/helpers";
import getAction from "../../models/action/get";

export default async function(req) {
  checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  const action = await getAction({
    actionId: req.params.actionId,
  });

  return {
    status: 200,
    body: JSON.stringify({ action }),
  };
}
