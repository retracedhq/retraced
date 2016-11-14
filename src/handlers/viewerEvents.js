const _ = require('lodash');

const validateSession = require('../security/validateSession');
const searchEvents = require('../models/event/search');
const listActors = require('../models/actor/list');
const listObjects = require('../models/object/list');
const addDisplayTitles = require('../models/event/addDisplayTitles');

const handler = (req) => {
  return new Promise((resolve, reject) => {
    let claims;
    const result = {
      events: [],
      total_hits: 0,
    };

    validateSession("viewer", req.get("Authorization"))
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
          project_id: req.params.projectId,
          environment_id: req.query.evironment_id,
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
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
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
          project_id: req.params.projectId,
          environment_id: req.query.environment_id,
        });
      })
      .then((events) => {
        result.events = events;

        resolve({ result });
      })
      .catch(reject);
  });
}

module.exports = handler;
