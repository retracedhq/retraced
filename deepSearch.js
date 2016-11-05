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
    const query = event.body.query;
    query.create = true;
    query.read = true;
    query.update = true;
    query.delete = true;

    return deepSearchEvents({
      index,
      team_omitted: true,
      query: query,
    });
  })
  .then((searchResults) => {
    cb(null, searchResults);
  })
  .catch((err) => {
    cb(err);
  });
};
