'use strict';

const getViewerToken = require('./lib/models/viewertoken/get');
const createViewersession = require('./lib/models/viewersession/create');

const iopipe = require('iopipe')({
  clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
});

module.exports.default = iopipe(
  (event, context, cb) => {
    getViewerToken({
      viewer_token: event.body.token,
    })
    .then((token) => {
      return createViewersession({
        token,
      });
    })
    .then((session) => {
      cb(null, session);
    })
    .catch((err) => {
      cb(err);
    });
  }
);
