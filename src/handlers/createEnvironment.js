const validateSession = require('../security/validateSession');
const checkAccess = require('../security/checkAccess');
const createEnvironment = require('../models/environment/create');
const getProject = require('../models/project/get');

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
        
        return createEnvironment({
          project_id: req.params.projectId,
          name: req.body.name,
        });
      })
      .then((environment) => {
        return getProject(req.params.projectId);
      })
      .then((project) => {
        resolve({ environments: project.environments });
      })
      .catch(reject);
  });
};

module.exports = handler;
