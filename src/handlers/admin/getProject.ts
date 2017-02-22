import * as _ from "lodash";

import { checkAdminAccess } from "../../security/helpers";
import getProject from "../../models/project/get";
import listApiTokens from "../../models/api_token/list";
import listEnvironments from "../../models/environment/list";

export default async function (req) {
  await checkAdminAccess(req);

  const project = await getProject(req.params.projectId);

  const environments = await listEnvironments({
    project_id: req.params.projectId,
  });

  const prunedEnvironments: any = [];
  _.forEach(environments, (env) => {
    prunedEnvironments.push(_.omit(env, ["project_id"]));
  });

  const apiTokens = await listApiTokens({
    project_id: req.params.projectId,
  });

  return {
    status: 200,
    body: JSON.stringify({
      environments: prunedEnvironments,
      tokens: apiTokens,
    }),
  };
}
