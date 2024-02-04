import { Environment, EnvironmentHydrated } from "../environment";
import getDeletionRequest from "../deletion_request/getByResourceId";
import hydrateDeletionRequest from "../deletion_request/hydrate";

export default async function hydrateEnvironment(env: Environment): Promise<EnvironmentHydrated> {
  const dr = await getDeletionRequest(env.id);

  if (dr) {
    return {
      ...env,
      deletionRequest: await hydrateDeletionRequest(dr),
    };
  }

  return env;
}
