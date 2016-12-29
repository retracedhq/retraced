import validateSession from "../security/validateSession";
import checkAccess from "../security/checkAccess";
import createEnvironment from "../models/environment/create";
import getProject from "../models/project/get";

export default function handler(req) {
  return new Promise((resolve, reject) => {
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

        return createEnvironment({
          project_id: req.params.projectId,
          name: req.body.name,
        });
      })
      .then((environment) => {
        return getProject(req.params.projectId);
      })
      .then((project) => {
        resolve({
          status: 201,
          body: JSON.stringify({ environments: project.environments }),
        });
      })
      .catch(reject);
  });
};
