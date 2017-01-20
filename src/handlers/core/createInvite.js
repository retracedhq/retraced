import checkAccess from "../../security/checkAccess";
import validateSession from "../../security/validateSession";
import createInvite from "../../models/team/invite";

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

        return createInvite({
          email: req.body.email,
          project_id: req.params.projectId,
        });
      })
      .then((invitation) => {
        resolve({
          status: 201,
          body: JSON.stringify({ invitation: invitation }),
        });
      })
      .catch(reject);
  });
}
