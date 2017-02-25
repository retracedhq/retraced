import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * listActions returns a Promise that retrieves all of the actions for
 * a given project and environment
 *
 * @param {Object} [opts] The request options
 * @param {string} [opts.project_id] The project id to query
 * @param {string} [opts.environment_id] The environment id to query
 */
export default function listActions(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const values = `id, environment_id, event_count, action, project_id, display_template,
        extract(epoch from created) * 1000 as created,
        extract(epoch from first_active) * 1000 as first_active,
        extract(epoch from last_active) * 1000 as last_active`;

      const q = `select ${values} from action where
      project_id = $1 and
      environment_id = $2 order by action`;
      const v = [
        opts.project_id,
        opts.environment_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          resolve(result.rows);
        } else {
          resolve([]);
        }
      });
    });
  });
}
