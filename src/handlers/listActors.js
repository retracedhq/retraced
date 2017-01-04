import validateSession from "../security/validateSession";
import listActors from "../models/actor/list";
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
        return listActors({
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
        });
      })
      .then((actors) => {
        resolve({
          status: 200,
          body: JSON.stringify({ actors: actors }),
        });
      })
      .catch(reject);
  });
};
