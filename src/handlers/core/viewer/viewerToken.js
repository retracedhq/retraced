import "source-map-support/register";
import validateApiToken from "../../../security/validateApiToken";
import createViewerToken from "../../../models/viewertoken/create";
import checkAccess from "../../../security/checkAccess";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    let apiToken;
    validateApiToken(req.get("Authorization"))
      .then((t) => {
        apiToken = t;
        return checkAccess({
          api_token: apiToken,
          project_id: req.params.projectId,
        });
      })
      .then((valid) => {
        if (!valid) {
          reject({ status: 401, err: new Error("Unauthorized") });
          return;
        }

        return createViewerToken({
          project_id: req.params.projectId,
          environment_id: apiToken.environment_id,
          group_id: req.query.group_id,
          format: req.query.output ? req.query.output : "json",
          is_admin: req.query.is_admin === "true",
        });
      })
      .then((viewerToken) => {
        const result = {
          token: viewerToken,
        };

        resolve({
          status: 200,
          body: JSON.stringify(result),
        });
      })
      .catch(reject);
  });
};
