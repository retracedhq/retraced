const validateApiToken = require("../security/validateApiToken");
const createViewerToken = require("../models/viewertoken/create");
const checkAccess = require("../security/checkAccess");

const handler = (req) => {
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
          team_id: req.query.team_id,
          format: req.query.output ? req.query.output : "json",
        });
      })
      .then((viewerToken) => {
        const result = {
          token: viewerToken,
        };

        resolve(result);
        return;
      })
      .catch(reject);
  });
};

module.exports = handler;
