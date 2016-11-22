const validateSession = require("../security/validateSession");
const checkAccess = require("../security/checkAccess");
const updateAction = require("../models/action/update");

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

        return updateAction({
          action_id: req.params.actionId,
          display_template: req.body.display_template,
        });
      })
      .then((action) => {
        resolve({ action: action });
      })
      .catch(reject);
  });
};

module.exports = handler;
