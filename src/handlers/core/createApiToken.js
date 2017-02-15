import "source-map-support/register";
import validateSession from "../../security/validateSession";
import checkAccess from "../../security/checkAccess";
import createApiToken from "../../models/apitoken/create";
import listApiTokens from "../../models/apitoken/list";

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

        return createApiToken({
          project_id: req.params.projectId,
          name: req.body.name,
          environment_id: req.body.environment_id,
        });
      })
      .then(() => {
        return listApiTokens({
          project_id: req.params.projectId,
        });
      })
      .then((apiTokens) => {
        resolve({
          body: JSON.stringify({ apiTokens }),
        });
      })
      .catch(reject);
  });
};
