import validateSession from "../security/validateSession";
import listTargets from "../models/target/list";
import checkAccess from "../security/checkAccess";

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
        return listTargets({
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
        });
      })
      .then((targets) => {
        resolve({
          status: 200,
          body: JSON.stringify({ targets: targets }),
        });
      })
      .catch(reject);
  });
};
