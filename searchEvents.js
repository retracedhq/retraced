'use strict';

let _ = require('lodash');

let validateSession = require('./lib/security/validateSession');
let checkAccess = require('./lib/security/checkAccess');
let searchEvents = require('./lib/models/event/search');
let addDisplayTitles = require('./lib/models/event/addDisplayTitles');
let listActors = require('./lib/models/actor/list');
let listObjects = require('./lib/models/object/list');

module.exports.default = (event, context, cb) => {
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
      cb(new Error('[401] Unauthorized'));
      return;
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

    let actor_ids = _.keys(_.countBy(result.events, 'actor_id'));

    return listActors({
      project_id: event.path.projectId,
      environment_id: event.query.evironment_id,
      actor_ids,
    });
  })
  .then((actors) => {
    let cleaned = _.map(result.events, (e) => {
      e.actor = _.find(actors, { id: e.actor_id }); 
      return e;
    });
    result.events = cleaned;

    let object_ids = _.keys(_.countBy(result.events, 'object_id'));

    return listObjects({
      project_id: event.path.projectId,
      environment_id: event.query.environment_id,
      object_ids,
    });
  })
  .then((objects) => {
    let cleaned = _.map(result.events, (e) => {
      e.object = _.find(objects, { id: e.object_id });
      return e;
    })

    result.events = cleaned;
    
    return addDisplayTitles({
      events:result.events,
      project_id: event.path.projectId,
      environment_id: event.query.environment_id
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
