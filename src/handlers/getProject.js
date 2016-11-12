const _ = require('lodash');

const validateSession = require('../security/validateSession');
const checkAccess = require('../security/checkAccess');
const getProject = require('../models/project/get');
const listApiTokens = require('../models/apitoken/list');
const listEnvironments = require('../models/environment/list');

const handler = (req) => {
  return new Promise((resolve, reject) => {
    const result = {
      tokens: [],
      environments: [],
    };

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
        return getProject(req.params.projectId);
      })
      .then((project) => {
        return listEnvironments({ project_id: req.params.projectId });
      })
      .then((environments) => {
        _.forEach(environments, (env) => {
          result.environments.push(_.omit(env, ['project_id']));
        });
        return listApiTokens({
          project_id: req.params.projectId,
        });
      })
      .then((apiTokens) => {
        result.tokens = apiTokens;
        resolve(result);
      })
      .catch(reject);
  });
};

module.exports = handler;
