import validateSession from "../../security/validateSession";
import checkAccess from "../../security/checkAccess";
import createToken from "../../models/token/create";
import listTokens from "../../models/token/list";

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

        return createToken({
          project_id: req.params.projectId,
          name: req.body.name,
          environment_id: req.body.environment_id,
        });
      })
      .then(() => {
        return listTokens({
          project_id: req.params.projectId,
        });
      })
      .then((tokens) => {
        resolve({
          status: 201,
          body: JSON.stringify({ tokens: tokens }),
        });
      })
      .catch(reject);
  });
};
