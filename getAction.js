'use strict';

let _ = require('lodash');

let validateSession = require('./lib/security/validateSession');
let checkAccess = require('./lib/security/checkAccess');
let getAction = require('./lib/models/action/get');

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
  .then((hasAccess) => {
    if (!hasAccess) {
      cb(new Error('[401] Unauthorized'));
      return;
    }
    return getAction({
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
      action_id: event.path.actionId
    });
  })
  .then((action) => {
    cb(null, { action: action });
  })
  .catch((err) => {
    cb(err);
  });
};
