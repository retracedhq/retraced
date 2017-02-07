import "source-map-support/register";
import validateSession from "../../security/validateSession";
import checkAccess from "../../security/checkAccess";
import updateAction from "../../models/action/update";

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

        return updateAction({
          action_id: req.params.actionId,
          display_template: req.body.display_template,
        });
      })
      .then((action) => {
        resolve({
          status: 200,
          body: JSON.stringify({ action: action }),
        });
      })
      .catch(reject);
  });
};
