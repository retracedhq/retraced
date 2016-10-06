'use strict';

const _ = require('lodash');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const getEventsBulk = require('./lib/models/event/getBulk');
const getActor = require('./lib/models/actor/get');

module.exports.default = (event, context, cb) => {
  let events;

  validateSession({
    jwt_source: 'viewer',
    event,
  })
  .then((claims) => {
    return getEventsBulk({
      project_id: event.path.projectId,
      environment_id: claims.environment_id,
      event_ids: event.body.event_ids,
    });
  })
  .then((ev) => {
    events = ev;

    return Promise.all(_.map(events, (e) => {
      return getActor({
        actor_id: e.actor_id,
      });
    }));
  })
  .then((actors) => {
    const fused = _.map(actors, (a, i) => {
      const e = events[i];
      e.actor = a;
      return e;
    });
    cb(null, { events: fused });
  })
  .catch((err) => {
    cb(err);
  });
};
