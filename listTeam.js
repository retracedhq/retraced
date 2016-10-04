'use strict';

let validateSession = require('./lib/security/validateSession');
let listTeam = require('./lib/models/team/list');
let checkAccess = require('./lib/security/checkAccess');
let listEnvironments = require('./lib/models/environment/list');

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
};

