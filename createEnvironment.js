'use strict';

var validateSession = require('./lib/security/validateSession');
var checkAccess = require('./lib/security/checkAccess');
var createEnvironment = require('./lib/models/environment/create');
var getProject = require('./lib/models/project/get');

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
    return createEnvironment({
      project_id: event.path.projectId,
      name: event.body.name
    })
  })
  .then((environment) => {
    return getProject(event.path.projectId)
  })
  .then((project) => {
    cb(null, {environments: project.environments});
  })
  .catch((err) => {
    console.log(err);
    cb(err);
  })
}



