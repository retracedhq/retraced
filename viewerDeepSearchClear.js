'use strict';

const _ = require('lodash');
const util = require('util');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const deepSearchClear = require('./lib/models/event/deepSearchClear');

const iopipe = require('iopipe')({
  clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
});

// TODO(zhaytee): Make this work for both viewer and admin
module.exports.default = iopipe(
  (event, context, cb) => {
    validateSession({
      jwt_source: 'viewer',
      event,
    })
    .then(() => {
      return deepSearchClear({ searchId: event.body.search_id });
    })
    .then(() => {
      cb(null);
    })
    .catch((err) => {
      cb(err);
    });
  }
);
