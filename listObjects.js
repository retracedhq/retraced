'use strict';

const validateSession = require('./lib/security/validateSession');
const listObjects = require('./lib/models/object/list');
const checkAccess = require('./lib/security/checkAccess');

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
  .then((hasAccess) => {
    if (!hasAccess) {
      throw new Error('[401] Unauthorized');
    }
    return listObjects({
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
    });
  })
  .then((objects) => {
    cb(null, { objects: objects });
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
