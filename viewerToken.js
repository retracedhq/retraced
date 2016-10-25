'use strict';

const validateApiToken = require('./lib/security/validateApiToken');
const createViewerToken = require('./lib/models/viewertoken/create');
const checkAccess = require('./lib/security/checkAccess');

const handler = (event, context, cb) => {
  let apiToken;
  validateApiToken(event)
  .then((t) => {
    apiToken = t;
    return checkAccess({
      api_token: apiToken,
      project_id: event.path.projectId,
    });
  })
  .then((valid) => {
    if (!valid) {
      cb(new Error('[401] Unauthorized'));
      return;
    }

    return createViewerToken({
      project_id: event.path.projectId,
      environment_id: apiToken.environment_id,
      team_id: event.query.team_id,
      format: event.query.output ? event.query.output : 'json',
    });
  })
  .then((viewerToken) => {
    const result = {
      token: viewerToken,
    };

    cb(null, result);
    return;
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
