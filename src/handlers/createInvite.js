const config = require("../config/getConfig")();
const checkAccess = require("../security/checkAccess");
const validateSession = require("../security/validateSession");
const createInvite = require("../models/team/invite");

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

        return createInvite({
          email: req.body.email,
          project_id: req.params.projectId,
        });
      })
      .then((invitation) => {
        resolve({ invitation: invitation });
      })
      .catch(reject);
  });
};

module.exports = handler;
