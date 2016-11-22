const validateSession = require("../security/validateSession");
const listTeam = require("../models/team/list");
const checkAccess = require("../security/checkAccess");
const listEnvironments = require("../models/environment/list");

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
        return listEnvironments({ project_id: req.params.projectId });
      })
      .then((envs) => {
        return listTeam({
          environments: envs,
          project_id: req.params.projectId,
        });
      })
      .then((team) => {
        resolve({ team });
      })
      .catch(reject);
  });
};

module.exports = handler;
