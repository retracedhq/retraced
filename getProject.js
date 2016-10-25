'use strict';

const _ = require('lodash');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const getProject = require('./lib/models/project/get');
const listApiTokens = require('./lib/models/apitoken/list');
const listEnvironments = require('./lib/models/environment/list');

const handler = (event, context, cb) => {
  const result = {
    tokens: [],
    environments: [],
  };

  validateSession({
    jwt_source: 'admin',
    event,
  })
  .then((claims) => {
    return checkAccess({
      user_id: claims.user_id,
      project_id: event.path.projectId,
    });
  })
  .then((hasAccess) => {
    if (!hasAccess) {
      cb(new Error('[401] Unauthorized'));
      return;
    }
    return getProject(event.path.projectId);
  })
  .then((project) => {
    return listEnvironments({ project_id: event.path.projectId });
  })
  .then((environments) => {
    _.forEach(environments, (env) => {
      result.environments.push(_.omit(env, ['project_id']));
    });
    return listApiTokens({
      project_id: event.path.projectId,
    });
  })
  .then((apiTokens) => {
    result.tokens = apiTokens;
    cb(null, result);
  })
  .catch((err) => {
    cb(err);
  });
};

if (require('./lib/config/getConfig')().IOPipe.ClientID) {
  const iopipe = require('iopipe')({
    clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
  });

  module.exports.default = iopipe(handler);
} else {
  module.exports.default = handler;
}
