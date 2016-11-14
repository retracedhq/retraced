const validateSession = require('../security/validateSession');
const listActions = require('../models/action/list');
const checkAccess = require('../security/checkAccess');

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
          reject({ status: 401, err: new Error('Unauthorized') });
          return;
        }
        return listActions({
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
        });
      })
      .then((actions) => {
        resolve({ actions: actions });
      })
      .catch(reject);
  });
};

module.exports = handler;
