'use strict';

const _ = require('lodash');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const getEventsBulk = require('./lib/models/event/getBulk');
const getActors = require('./lib/models/actor/gets');
const getObjects = require('./lib/models/object/gets');
const addDisplayTitles = require('./lib/models/event/addDisplayTitles');

module.exports.default = (event, context, cb) => {
  if (!event.query.environment_id) {
    cb(new Error('[400] Missing environment_id'));
    return;
  }

  let events;

  validateSession({
    jwt_source: 'admin',
    event,
  })
  .then((claims) => {
    return getEventsBulk({
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
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

    return getObjects({
      object_ids: _.map(events, (e) => {
        return e.object_id;
      }),
    });
  })
  .then((objects) => {
    // TODO this is pretty inefficient
    _.forEach(events, (e) => {
      e.object = _.find(objects, { id: e.object_id });
    });

    return addDisplayTitles({
      events,
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
    });
  })
  .then(() => {
    cb(null, { events });
  })
  .catch((err) => {
    cb(err);
  });
};
