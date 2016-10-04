'use strict';

let _ = require('lodash');

let validateSession = require('./lib/security/validateSession');
let checkAccess = require('./lib/security/checkAccess');
let getEvent = require('./lib/models/event/get');
let getActor = require('./lib/models/actor/get');

module.exports.default = (event, context, cb) => {
  var result = {};

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
      event_id: event.path.eventId
    });
  })
  .then((ev) => {
    result.event = ev;

    return getActor({ 
      actor_id: ev.actor_id,
    })
  })
  .then((actor) => {
    result.event.actor = actor;
    cb(null, { event: result.event });
  })
  .catch((err) => {
    cb(err);
  });
};
