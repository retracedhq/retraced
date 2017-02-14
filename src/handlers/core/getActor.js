import * as _ from "lodash";

import validateSession from "../../security/validateSession";
import checkAccess from "../../security/checkAccess";
import getActor from "../../models/actor/get";

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
        return getActor({
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
          actor_id: req.params.actorId,
        });
      })
      .then((actor) => {
        resolve({
          status: 200,
          body: JSON.stringify({ actor: actor }),
        });
      })
      .catch(reject);
  });
};
