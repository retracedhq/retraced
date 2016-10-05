'use strict';

var config = require('./lib/config/getConfig')();
var checkAccess = require('./lib/security/checkAccess');
var validateSession = require('./lib/security/validateSession');
var createInvite = require('./lib/models/team/invite');

module.exports.default = (event, context, cb) => {
  console.log('1');
  validateSession({
    jwt_source: 'admin',
    event: event
  })
  .then((claims) => {
    console.log('2');
    return checkAccess({
      user_id: claims.user_id,
      project_id: event.path.projectId
    });
  })
  .then((valid) => {
    console.log('3');
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
    console.log('4');
    cb(null, {invitation: invitation});
  })
  .catch((err) => {
    cb(err);
  })
}



