'use strict';

const _ = require('lodash');
const util = require('util');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const deepSearchEvents = require('./lib/models/event/deepSearch');

// TODO(zhaytee): Make this work for both viewer and admin
module.exports.default = (event, context, cb) => {
  validateSession({
    jwt_source: 'viewer',
    event,
  })
  .then((claims) => {
    const index = `retraced.${event.path.projectId}.${claims.environment_id}`;
    return deepSearchEvents({
      index,
      team_id: claims.team_id,
      query: event.body.query,
    });
  })
  .then((searchResults) => {
    cb(null, searchResults);
  })
  .catch((err) => {
    cb(err);
  });
};
