import { checkAdminAccess } from "../../security/helpers";
import listActors from "../../models/actor/list";

export default async function(req) {
  await checkAdminAccess(req);

  const actors = await listActors({
    projectId: req.params.projectId,
    environmentId: req.query.environment_id,
  });

  return {
    status: 200,
    body: JSON.stringify({ actors }),
  };
}
