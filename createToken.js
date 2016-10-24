'use strict';

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const createToken = require('./lib/models/token/create');
const listTokens = require('./lib/models/token/list');

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
    .then((valid) => {
      return createToken({
        project_id: event.path.projectId,
        name: event.body.name,
        environment_id: event.body.environment_id,
      });
    })
    .then(() => {
      return listTokens({
        project_id: event.path.projectId,
      });
    })
    .then((tokens) => {
      cb(null, { tokens: tokens });
    })
    .catch((err) => {
      console.log(err);
      cb(err);
    });
  }
);
