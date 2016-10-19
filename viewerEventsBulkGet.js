'use strict';

const _ = require('lodash');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const getEventsBulk = require('./lib/models/event/getBulk');
const getActors = require('./lib/models/actor/gets');
const getObjects = require('./lib/models/object/gets');
const addDisplayTitles = require('./lib/models/event/addDisplayTitles');

module.exports.default = (event, context, cb) => {
  let events, claims;

  console.log('starting');
  validateSession({
    jwt_source: 'viewer',
    event,
  })
  .then((c) => {
    claims = c;
    console.log('getting events');
    return getEventsBulk({
      project_id: event.path.projectId,
      environment_id: claims.environment_id,
      event_ids: event.body.event_ids,
    });
  })
  .then((ev) => {
    events = ev;
    console.log('calling getactors');
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
      events: events,
      project_id: event.path.projectId,
      environment_id: claims.environment_id
    })
  })
  .then((event) => {
    cb(null, { events });
  })
  .catch((err) => {
    cb(err);
  });
};
