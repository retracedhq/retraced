import * as _ from "lodash";

import getPgPool from "../../persistence/pg";
import gets from "./gets";

const pgPool = getPgPool();

/**
 * listActors returns a Promise that retrieves all of the actors for
 * a given project and environment, with an option to filter by an array of actor ids
 *
 * @param {Object} [opts] The request options
 * @param {string} [opts.actor_ids] The actor ids to retreive
 * @param {string} [opts.project_id] The project id to query
 * @param {string} [opts.environment_id] The environment id to query
 */
export default function listActors(opts) {
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

      const fields = `
        id, environment_id, event_count, foreign_id, name, project_id, url,
        extract(epoch from created) * 1000 as created,
        extract(epoch from first_active) * 1000 as first_active,
        extract(epoch from last_active) * 1000 as last_active`;

      const q = `select ${fields} from actor where
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
