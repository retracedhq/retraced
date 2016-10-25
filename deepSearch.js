'use strict';

const _ = require('lodash');
const util = require('util');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const deepSearchEvents = require('./lib/models/event/deepSearch');

module.exports.default = (event, context, cb) => {
  if (!event.query.environment_id) {
    cb(new Error('[400] Missing environment_id'));
    return;
  }

  validateSession({
    jwt_source: 'admin',
    event,
  })
  .then((claims) => {
    const index = `retraced.${event.path.projectId}.${event.query.environment_id}`;
    return deepSearchEvents({
      index,
      team_omitted: true,
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
