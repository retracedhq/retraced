import { checkAdminAccess } from "../../security/helpers";
import updateAction from "../../models/action/update";

export default async function (req) {
  await checkAdminAccess(req);

  const action = await updateAction({
    action_id: req.params.actionId,
    display_template: req.body.display_template,
  });

  return {
    status: 200,
    body: JSON.stringify({ action }),
  };
}
