'use strict';

var validateSession = require('./lib/security/validateSession');
var listActors = require('./lib/models/actor/list');
var checkAccess = require('./lib/security/checkAccess');

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
  .then((hasAccess) => {
    if (!hasAccess) {
      cb(new Error('[401] Unauthorized'));
      return;
    }
    return listActors({
      project_id: event.path.projectId,
      environment_id: event.query.environment_id
    })
  })
  .then((actors) => {
    cb(null, {actors: actors});
  })
  .catch(function(err) {
    cb(err);
  })
}


