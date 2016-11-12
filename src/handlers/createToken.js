const validateSession = require('../security/validateSession');
const checkAccess = require('../security/checkAccess');
const createToken = require('../models/token/create');
const listTokens = require('../models/token/list');

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
        resolve({ tokens: tokens });
      })
      .catch(reject);
  });
};

module.exports = handler;
