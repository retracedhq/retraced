'use strict';

const _ = require('lodash');

const validateSession = require('./lib/security/validateSession');
const searchEvents = require('./lib/models/event/search');
const listActors = require('./lib/models/actor/list');
const listObjects = require('./lib/models/object/list');
const addDisplayTitles = require('./lib/models/event/addDisplayTitles');

module.exports.default = (event, context, cb) => {
  let claims;
  const result = {
    events: [],
    total_hits: 0,
  };

  validateSession({
    jwt_source: 'viewer',
    event,
  })
  .then((c) => {
    claims = c;
    return searchEvents({
      project_id: claims.project_id,
      environment_id: claims.environment_id,
      team_id: claims.team_id,
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
  }).then((events) => {
    result.events = events;

    cb(null, { result });
  })
  .catch((err) => {
    cb(err);
  });
};
