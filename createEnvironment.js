'use strict';

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const createEnvironment = require('./lib/models/environment/create');
const getProject = require('./lib/models/project/get');

const handler = (event, context, cb) => {
  validateSession({
    jwt_source: 'admin',
    event: event,
  })
  .then((claims) => {
    return checkAccess({
      user_id: claims.user_id,
      project_id: event.path.projectId,
    });
  })
  .then((valid) => {
    return createEnvironment({
      project_id: event.path.projectId,
      name: event.body.name,
    });
  })
  .then((environment) => {
    return getProject(event.path.projectId);
  })
  .then((project) => {
    cb(null, { environments: project.environments });
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

