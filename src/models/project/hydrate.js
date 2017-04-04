import * as _ from "lodash";

import listApiTokens from "../api_token/list";
import listEnvironments from "../environment/list";

export default async function hydrateProject(project) {
  const environments = await listEnvironments({
    project_id: project.id,
  });

  const prunedEnvironments = [];
  _.forEach(environments, (env) => {
    prunedEnvironments.push(_.omit(env, ["project_id"]));
  });

  const apiTokens = await listApiTokens({
    project_id: project.id,
  });

  return {
    ...project,
    environments: prunedEnvironments,
    tokens: apiTokens,
  };
}
