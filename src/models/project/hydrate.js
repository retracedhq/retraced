import * as _ from "lodash";
import hydrateEnvironment from "../environment/hydrate";

import listApiTokens from "../api_token/list";
import { responseFromApiToken } from "../api_token";
import listEnvironments from "../environment/list";

export default async function hydrateProject(project) {
  const environments = await listEnvironments({
    projectId: project.id,
  });
  const hydratedEnvironments = await Promise.all(
    environments.map(hydrateEnvironment),
  );

  const prunedEnvironments = [];
  _.forEach(hydratedEnvironments, (env) => {
    prunedEnvironments.push(_.omit(env, ["project_id"]));
  });

  const apiTokens = await listApiTokens({
    projectId: project.id,
  });

  return {
    ...project,
    environments: prunedEnvironments,
    tokens: apiTokens.map(responseFromApiToken),
  };
}
