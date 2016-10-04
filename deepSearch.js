'use strict';

const _ = require('lodash');
const util = require('util');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const deepSearchEvents = require('./lib/models/event/deepSearch');
const es = require('./lib/persistence/elasticsearch');
// const listActors = require('./lib/models/actor/list');

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

    const index = `${event.path.projectId}.${event.query.environment_id}`;
    return deepSearchEvents({ index, query: event.body });
  })
  .then((searchResults) => {
    cb(searchResults);
  })
  .catch((err) => {
    cb(err);
  });
};
