'use strict';

const validateSession = require('./lib/security/validateSession');
const listActors = require('./lib/models/actor/list');
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
      cb(new Error('[401] Unauthorized'));
      return;
    }
    return listActors({
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
    });
  })
  .then((actors) => {
    cb(null, { actors: actors });
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
