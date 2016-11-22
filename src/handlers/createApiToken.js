const validateSession = require("../security/validateSession");
const checkAccess = require("../security/checkAccess");
const createApiToken = require("../models/apitoken/create");
const listApiTokens = require("../models/apitoken/list");

const handler = (req) => {
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
        resolve({ apiTokens });
      })
      .catch(reject);
  });
};

module.exports = handler;
