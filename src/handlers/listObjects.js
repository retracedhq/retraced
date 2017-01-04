import validateSession from "../security/validateSession";
import listObjects from "../models/object/list";
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
        return listObjects({
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
        });
      })
      .then((objects) => {
        resolve({
          status: 200,
          body: JSON.stringify({ objects: objects }),
        });
      })
      .catch(reject);
  });
};
