'use strict';

const getInvite = require('./lib/models/team/invite/get');

const handler = (event, context, cb) => {
  getInvite(event.query.id)
  .then((invitation) => {
    cb(null, { invitation: invitation });
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
