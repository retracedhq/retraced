'use strict';

const validateSession = require('./lib/security/validateSession');
const listActions = require('./lib/models/action/list');
const checkAccess = require('./lib/security/checkAccess');

const iopipe = require('iopipe')({
  clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
});

module.exports.default = iopipe(
  (event, context, cb) => {
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
      return listActions({
        project_id: event.path.projectId,
        environment_id: event.query.environment_id,
      });
    })
    .then((actions) => {
      cb(null, { actions: actions });
    })
    .catch((err) => {
      cb(err);
    });
  }
);
