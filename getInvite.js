'use strict';

var getInvite = require('./lib/models/team/invite/get');

module.exports.default = (event, context, cb) => {
  getInvite(event.query.id)
  .then((invitation) => {
    cb(null, {invitation: invitation});
  })
  .catch((err) => {
    cb(err);
  })
}



