const validateSession = require('../security/validateSession');
const listObjects = require('../models/object/list');
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
        return listObjects({
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
        });
      })
      .then((objects) => {
        resolve({ objects: objects });
      })
      .catch(reject);
  });
};

module.exports = handler;
