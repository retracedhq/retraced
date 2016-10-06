'use strict';

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const createApiToken = require('./lib/models/apitoken/create');
const listApiTokens = require('./lib/models/apitoken/list');

module.exports.default = (event, context, cb) => {
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
  .then((valid) => {
    return createApiToken({
      project_id: event.path.projectId,
      name: event.body.name,
      environment_id: event.body.environment_id,
    });
  })
  .then(() => {
    return listApiTokens({
      project_id: event.path.projectId,
    });
  })
  .then((apiTokens) => {
    cb(null, { apiTokens });
  })
  .catch((err) => {
    console.log(err);
    cb(err);
  });
};

