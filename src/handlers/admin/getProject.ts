
import { checkAdminAccess } from "../../security/helpers";
import getProject from "../../models/project/get";
import hydrateProject from "../../models/project/hydrate";

export default async function(req) {
  await checkAdminAccess(req.get("Authorization"), req.params.projectId, req.params.environment_id);

  const project = await getProject(req.params.projectId);
  if (!project) {
    return { status: 404 };
  }

  const hydrated = await hydrateProject(project);

  return {
    status: 200,
    body: JSON.stringify({ project: hydrated }),
  };
}
