import * as _ from "lodash";

import validateSession from "../../security/validateSession";
import checkAccess from "../../security/checkAccess";
import getProject from "../../models/project/get";
import listApiTokens from "../../models/apitoken/list";
import listEnvironments from "../../models/environment/list";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    const result = {
      tokens: [],
      environments: [],
    };

    validateSession("admin", req.get("Authorization"))
      .then((claims) => {
        return checkAccess({
          user_id: claims.user_id,
          project_id: req.params.projectId,
        });
      })
      .then((valid) => {
        if (!valid) {
          reject({ status: 401, err: new Error("Unauthorized") });
          return;
        }
        return getProject(req.params.projectId);
      })
      .then((project) => {
        return listEnvironments({ project_id: req.params.projectId });
      })
      .then((environments) => {
        _.forEach(environments, (env) => {
          result.environments.push(_.omit(env, ["project_id"]));
        });
        return listApiTokens({
          project_id: req.params.projectId,
        });
      })
      .then((apiTokens) => {
        result.tokens = apiTokens;
        resolve({
          status: 200,
          body: JSON.stringify(result),
        });
      })
      .catch(reject);
  });
};
