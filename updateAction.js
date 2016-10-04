'use strict';

var validateSession = require('./lib/security/validateSession');
var checkAccess = require('./lib/security/checkAccess');
var updateAction = require('./lib/models/action/update');

module.exports.default = (event, context, cb) => {
  validateSession({
    jwt_source: 'admin',
    event: event
  })
  .then((claims) => {
    return checkAccess({
      user_id: claims.user_id,
      project_id: event.path.projectId
    })
  })
  .then((valid) => {
    return updateAction({
      action_id: event.path.actionId,
      display_template: event.body.display_template
    })
  })
  .then((action) => {
    cb(null, { action: action });
  })
  .catch((err) => {
    console.log(err);
    cb(err);
  })
}



