'use strict';

var validateToken = require('./lib/security/validateToken');
var createViewertoken = require('./lib/models/viewertoken/create');
var findActor = require('./lib/models/actor/find');
var checkAccess = require('./lib/security/checkAccess');

module.exports.default = (event, context, cb) => {
  var token;
  validateToken(event)
    .then((t) => {
      token = t;
      return checkAccess({
        token: t.token,
        project_id: event.path.projectId
      });
    })
    .then((valid) => {
      if (!valid) {
        cb(new Error('[401] Unauthorized'));
        return;
      }

      // The naming of these actor find fields is getting confusing...
      return findActor({
        token: token,
        actor: {
          id: event.query.actor_id
        }
      })
    })
    .then((actor) => {
      // if the actor wasn't found, return a 404.
      if (!actor) {
        cb(new Error('not found'));
        return;
      }

      return createViewertoken({
        project_id: event.path.projectId,
        environment_id: token.environment_id,
        actor_foreign_id: event.body.actor_id,
        team_id: event.query.team_id,
        format: event.query.output ? event.query.output : 'json'
      });
    })
    .then((viewerToken) => {
      var result = {
        token: viewerToken.token
      }

      cb(null, result);
      return;
    })
    .catch((err) => {
      cb(err);
    })
}
