import { checkAdminAccessUnwrapped } from "../../security/helpers";
import { Environment } from "../../models/environment";
import createEnvironmentModel from "../../models/environment/create";
import populateEnvUsers from "../../models/environmentuser/populate_from_project";

export default async function createEnvironment(
  auth: string,
  projectId: string,
  name: string,
  id?: string
): Promise<Environment> {
  await checkAdminAccessUnwrapped(auth, projectId);

  const env = await createEnvironmentModel({
    projectId,
    name,
    id,
  });

  await populateEnvUsers({
    project_id: projectId,
    environment_id: env.id,
  });

  return env;
}
