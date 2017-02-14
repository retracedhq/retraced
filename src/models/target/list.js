import * as _ from "lodash";

import getPgPool from "../../persistence/pg";
import gets from "./gets";

const pgPool = getPgPool();

/**
 * listTargets returns a Promise that retrieves all of the targets for
 * a given project and environment, with an option to filter by an array of actor ids
 *
 * @param {Object} [opts] The request options
 * @param {string} [opts.target_ids] The target ids to retreive
 * @param {string} [opts.project_id] The project id to query
 * @param {string} [opts.environment_id] The environment id to query
 */
export default function listTargets(opts) {
  if (opts.target_ids && opts.target_ids.length > 0) {
    return gets(opts);
  }
  return listTargetsForProjectAndEnvironment(opts.project_id, opts.environment_id);
}

function listTargetsForProjectAndEnvironment(projectId, environmentId) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = `select * from target where
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
            row.retraced_object_type = "target";
            return row;
          }));
        } else {
          resolve([]);
        }
      });
    });
  });
}
