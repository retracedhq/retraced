import { checkAdminAccess } from "../../security/helpers";
import getActor from "../../models/actor/get";

export default async function (req) {
  await checkAdminAccess(req);

  const actor = await getActor({
    project_id: req.params.projectId,
    environment_id: req.query.environment_id,
    actor_id: req.params.actorId,
  });

  return {
    status: 200,
    body: JSON.stringify({ actor }),
  };
}
