'use strict';

var config = require('./lib/config/getConfig')();
var checkAccess = require('./lib/security/checkAccess');
var validateSession = require('./lib/security/validateSession');
var createInvite = require('./lib/models/team/invite');

module.exports.default = (event, context, cb) => {
  validateSession({
    jwt_source: 'admin',
    event: event
  })
  .then((claims) => {
    return checkAccess({
      user_id: claims.user_id,
      project_id: event.path.projectId
    });
  })
  .then((valid) => {
    if (!valid) {
      cb(new Error('[401] Unauthorized'));
      return;
    }

    return createInvite({
      email: event.body.email,
      project_id: event.path.projectId
    });
  })
  .then((invitation) => {
    cb(null, {invitation: invitation});
  })
  .catch((err) => {
    cb(err);
  })
}



