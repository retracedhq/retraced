import "source-map-support/register";
import * as _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously returns all tokens for a project from the database
 *
 * @param {Object} [opts] The request options.
 */
export default function listApiTokens(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = "select * from token where project_id = $1";
      const v = [opts.project_id];

      pg.query(q, v, (qerr, queryResult) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (queryResult.rowCount > 0) {
          resolve(queryResult.rows);
        } else {
          resolve([]);
        }
      });
    });
  });
}
