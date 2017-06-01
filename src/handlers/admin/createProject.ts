import { checkAdminAccess } from "../../security/helpers";
import createProject from "../../models/project/create";
import hydrateProject from "../../models/project/hydrate";

export default async function(req) {
  const claims = await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  const project = await createProject({
    user_id: claims.userId,
    name: req.body.name,
  });

  const hydrated = await hydrateProject(project);

  return {
    status: 201,
    body: JSON.stringify({ project: hydrated }),
  };
}
