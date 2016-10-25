'use strict';

const validateSession = require('./lib/security/validateSession');
const listProjects = require('./lib/models/project/list');

const handler = (event, context, cb) => {
  validateSession({
    jwt_source: 'admin',
    event,
  })
  .then((claims) => {
    return listProjects({
      user_id: claims.user_id,
    });
  })
  .then((projects) => {
    cb(null, { projects });
  })
  .catch((err) => {
    cb(err);
  });
};

if (require('./lib/config/getConfig')().IOPipe.ClientID) {
  const iopipe = require('iopipe')({
    clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
  });

  module.exports.default = iopipe(handler);
} else {
  module.exports.default = handler;
}
