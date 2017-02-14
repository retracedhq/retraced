import validateSession from "../../security/validateSession";
import listGroup from "../../models/group/list";
import checkAccess from "../../security/checkAccess";
import listEnvironments from "../../models/environment/list";

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
        return listEnvironments({ project_id: req.params.projectId });
      })
      .then((envs) => {
        return listGroup({
          environments: envs,
          project_id: req.params.projectId,
        });
      })
      .then((group) => {
        resolve({
          status: 200,
          body: JSON.stringify({ group }),
        });
      })
      .catch(reject);
  });
};
