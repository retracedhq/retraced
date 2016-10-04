'use strict';

var validateSession = require('./lib/security/validateSession');
var checkAccess = require('./lib/security/checkAccess');
var createProject = require('./lib/models/project/create');

module.exports.default = (event, context, cb) => {
  validateSession({
    jwt_source: 'admin',
    event: event
  })
  .then((claims) => {
    return createProject({
      user_id: claims.user_id, 
      name: event.body.name
    });
  })
  .then((project) => {
    cb(null, {project: project});
  })
  .catch((err) => {
    console.log(err);
    cb(err);
  })
}



