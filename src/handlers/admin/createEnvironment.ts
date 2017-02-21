import { checkAdminAccess } from "../../security/helpers";
import createEnvironment from "../../models/environment/create";
import getProject from "../../models/project/get";

export default async function (req) {
  await checkAdminAccess(req);

  await createEnvironment({
    project_id: req.params.projectId,
    name: req.body.name,
  });

  const project: any = await getProject(req.params.projectId);

  return {
    status: 201,
    body: JSON.stringify({ environments: project.environments }),
  };
}
