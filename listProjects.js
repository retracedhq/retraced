'use strict';

const validateSession = require('./lib/security/validateSession');
const listProjects = require('./lib/models/project/list');

module.exports.default = (event, context, cb) => {
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

