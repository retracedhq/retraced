import { checkAdminAccess } from "../../security/helpers";
import createEnvironment from "../../models/environment/create";
import populateEnvUsers from "../../models/environmentuser/populate_from_project";

export default async function(req) {
  await checkAdminAccess(req);

  const env = await createEnvironment({
    project_id: req.params.projectId,
    name: req.body.name,
  });

  await populateEnvUsers({
    project_id: req.params.projectId,
    environment_id: env.id,
  });

  return {
    status: 201,
    body: JSON.stringify(env),
  };
}
