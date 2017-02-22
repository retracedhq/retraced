import { checkAdminAccess } from "../../security/helpers";
import listActors from "../../models/actor/list";

export default async function (req) {
  await checkAdminAccess(req);

  const actors = listActors({
    project_id: req.params.projectId,
    environment_id: req.query.environment_id,
  });

  return {
    status: 200,
    body: JSON.stringify({ actors }),
  };
}
