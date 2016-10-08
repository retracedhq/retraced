'use strict';

const _ = require('lodash');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const getEventsBulk = require('./lib/models/event/getBulk');
const getActors = require('./lib/models/actor/gets');

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
    return getActors({
      actor_ids: _.map(events, (e) => {
        return e.actor_id;
      }),
    });
  })
  .then((actors) => {
    // TODO(zhaytee): This is pretty inefficient.
    _.forEach(events, (e) => {
      e.actor = _.find(actors, { id: e.actor_id });
    });
    cb(null, { events });
  })
  .catch((err) => {
    cb(err);
  });
};
