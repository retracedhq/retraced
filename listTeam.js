'use strict';

const validateSession = require('./lib/security/validateSession');
const listTeam = require('./lib/models/team/list');
const checkAccess = require('./lib/security/checkAccess');
const listEnvironments = require('./lib/models/environment/list');

const iopipe = require('iopipe')({
  clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
});

module.exports.default = iopipe(
  (event, context, cb) => {
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
      return listEnvironments({ project_id: event.path.projectId });
    })
    .then((envs) => {
      return listTeam({
        environments: envs,
        project_id: event.path.projectId,
      });
    })
    .then((team) => {
      cb(null, { team });
    })
    .catch((err) => {
      cb(err);
    });
  }
);
