'use strict';

var getViewertoken = require('./lib/models/viewertoken/get');
var createViewersession = require('./lib/models/viewersession/create');

module.exports.default = (event, context, cb) => {
  getViewertoken({
    token: event.body.token
  })
  .then((token) => {
    return createViewersession({
      token: token
    })
  })
  .then((session) => {
    cb(null, session);
  })
  .catch((err) => {
    cb(err);
  })
}


