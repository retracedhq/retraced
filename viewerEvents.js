'use strict';

const _ = require('lodash');

const validateSession = require('./lib/security/validateSession');
const searchEvents = require('./lib/models/event/search');
const listActors = require('./lib/models/actor/list');

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

    const actorIds = _.keys(_.countBy(result.events, 'actor_id'));

    return listActors({
      project_id: claims.project_id,
      environment_id: claims.environment_id,
      actor_ids: actorIds,
    });
  })
  .then((actors) => {
    const cleaned = _.map(result.events, (e) => {
      e.actor = _.find(actors, { id: e.actor_id });
      return e;
    });
    result.events = cleaned;
    cb(null, { result });
  })
  .catch((err) => {
    cb(err);
  });
};
