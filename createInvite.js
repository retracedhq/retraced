'use strict';

const config = require('./lib/config/getConfig')();
const checkAccess = require('./lib/security/checkAccess');
const validateSession = require('./lib/security/validateSession');
const createInvite = require('./lib/models/team/invite');

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
    if (!valid) {
      throw new Error('[401] Unauthorized');
    }

    return createInvite({
      email: event.body.email,
      project_id: event.path.projectId,
    });
  })
  .then((invitation) => {
    cb(null, { invitation: invitation });
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
