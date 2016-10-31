'use strict';

let _ = require('lodash');

const validateSession = require('./lib/security/validateSession');
const checkAccess = require('./lib/security/checkAccess');
const searchEvents = require('./lib/models/event/search');
const addDisplayTitles = require('./lib/models/event/addDisplayTitles');
const listActors = require('./lib/models/actor/list');
const listObjects = require('./lib/models/object/list');

const handler = (event, context, cb) => {
  let result = {
    events: [],
    total_hits: 0,
  };

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
      throw new Error('[401] Unauthorized');
    }
    return searchEvents({
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
      queries: event.body.queries,
    });
  })
  .then((events) => {
    result.events = events;
    result.total_hits = events.length;

    const actorIds = _.keys(_.countBy(result.events, 'actor_id'));

    return listActors({
      project_id: event.path.projectId,
      environment_id: event.query.evironment_id,
      actorIds,
    });
  })
  .then((actors) => {
    const cleaned = _.map(result.events, (e) => {
      e.actor = _.find(actors, { id: e.actor_id });
      return e;
    });
    result.events = cleaned;

    const objectIds = _.keys(_.countBy(result.events, 'object_id'));

    return listObjects({
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
      objectIds,
    });
  })
  .then((objects) => {
    const cleaned = _.map(result.events, (e) => {
      e.object = _.find(objects, { id: e.object_id });
      return e;
    });

    result.events = cleaned;

    return addDisplayTitles({
      events: result.events,
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
    });
  })
  .then((events) => {
    result.events = events;

      cb(null, { result });
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
