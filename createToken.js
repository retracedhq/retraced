'use strict';

var validateSession = require('./lib/security/validateSession');
var checkAccess = require('./lib/security/checkAccess');
var createToken = require('./lib/models/token/create');
var listTokens = require('./lib/models/token/list');

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
    return createToken({
      project_id: event.path.projectId,
      name: event.body.name,
      environment_id: event.body.environment_id
    })
  })
  .then(() => {
    return listTokens({
      project_id: event.path.projectId
    });
  })
  .then((tokens) => {
    cb(null, {tokens: tokens});
  })
  .catch((err) => {
    console.log(err);
    cb(err);
  })
}



