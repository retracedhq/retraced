'use strict';

const _ = require('lodash');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const getEvent = require('./lib/models/event/get');
const getActor = require('./lib/models/actor/get');

const handler = (event, context, cb) => {
  const result = {};

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
    return getEvent({
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
      event_id: event.path.eventId,
    });
  })
  .then((ev) => {
    result.event = ev;

    return getActor({
      actor_id: ev.actor_id,
    });
  })
  .then((actor) => {
    result.event.actor = actor;
    cb(null, { event: result.event });
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
