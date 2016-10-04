'use strict';

var _ = require('lodash');

var validateSession = require('./lib/security/validateSession');
var searchEvents = require('./lib/models/event/search');
var listActors = require('./lib/models/actor/list');

module.exports.default = (event, context, cb) => {
  var claims,
      result = {
        events: [],
        total_hits: 0
      }

  validateSession({
    jwt_source: 'viewer',
    event: event
  })
  .then((c) => {
    claims = c;
    return searchEvents({
      project_id: claims.project_id,
      environment_id: claims.environment_id,
      team_id: claims.team_id
    })
  })
  .then((events) => {
    result.events = events;
    result.total_hits = events.length;

    var actor_ids = _.keys(_.countBy(result.events, 'actor_id'));

    return listActors({
      project_id: claims.project_id,
      environment_id: claims.environment_id,
      actor_ids: actor_ids
    });
  })
  .then((actors) => {
    var cleaned = _.map(result.events, (e) => {
      e.actor = _.find(actors, {id: e.actor_id});;
      return e;
    });
    result.events = cleaned;
    cb(null, {result: result});
  })
  .catch((err) => {
    cb(err);
  })
}
