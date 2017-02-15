import "source-map-support/register";
import * as _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously fetch >=1 actor(s) from the database.
 *
 * @param {string} [actor_ids] The unique actor id(s) to fetch
 */
export default function getActors(opts) {
  return new Promise((resolve, reject) => {
    if (opts.actor_ids.length === 0) {
      resolve([]);
      return;
    }

    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const tokenList = _.map(opts.actor_ids, (a, i) => { return `$${i + 1}`; });
      const q = `select * from actor where id in (${tokenList})`;
      const v = opts.actor_ids;
      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          _.forEach(result.rows, (row) => {
            row.retraced_object_type = "actor";
          });
          resolve(result.rows);
        } else {
          resolve(null);
        }
      });
    });
  });
}
