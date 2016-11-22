const _ = require("lodash");
const pgPool = require("../../persistence/pg")();
const gets = require("./gets");

/**
 * listActors returns a Promise that retrieves all of the actors for
 * a given project and environment, with an option to filter by an array of actor ids
 *
 * @param {Object} [opts] The request options
 * @param {string} [opts.actor_ids] The actor ids to retreive
 * @param {string} [opts.project_id] The project id to query
 * @param {string} [opts.environment_id] The environment id to query
 */
function listActors(opts) {
  if (opts.actor_ids && opts.actor_ids.length > 0) {
    return gets(opts);
  }
  return listActorsForProjectAndEnvironment(opts.project_id, opts.environment_id);
}

function listActorsForProjectAndEnvironment(projectId, environmentId) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = `select * from actor where
      project_id = $1 and
      environment_id = $2`;
      const v = [
        projectId,
        environmentId,
      ];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          resolve(_.map(result.rows, (row) => {
            row.retraced_object_type = "actor";
            return row;
          }));
        } else {
          resolve([]);
        }
      });
    });
  });
}

module.exports = listActors;
