import * as _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously fetch >=1 target(s) from the database.
 *
 * @param {string} [target_dis] The unique target id(s) to fetch
 */
export default function getTargets(opts) {
  return new Promise((resolve, reject) => {
    if (opts.target_ids.length === 0) {
      resolve([]);
      return;
    }

    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const fields = `id, environment_id, event_count, foreign_id, name, project_id, url, type,
        extract(epoch from created) * 1000 as created,
        extract(epoch from first_active) * 1000 as first_active,
        extract(epoch from last_active) * 1000 as last_active`;

      const tokenList = _.map(opts.target_ids, (a, i) => { return `$${i + 1}`; });
      const q = `select ${fields} from target where id in (${tokenList})`;
      const v = opts.target_ids;
      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          _.forEach(result.rows, (row) => {
            row.retraced_object_type = "target";
          });
          resolve(result.rows);
        } else {
          resolve(null);
        }
      });
    });
  });
}
