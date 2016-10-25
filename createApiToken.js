'use strict';

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const createApiToken = require('./lib/models/apitoken/create');
const listApiTokens = require('./lib/models/apitoken/list');

const handler = (event, context, cb) => {
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

if (require('./lib/config/getConfig')().IOPipe.ClientID) {
  const iopipe = require('iopipe')({
    clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
  });

  module.exports.default = iopipe(handler);
} else {
  module.exports.default = handler;
}
