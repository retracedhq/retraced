'use strict';

const validateApiToken = require('./lib/security/validateApiToken');
const createViewerToken = require('./lib/models/viewertoken/create');
const checkAccess = require('./lib/security/checkAccess');

module.exports.default = (event, context, cb) => {
  cb(null, {token: '123'});
};
