import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously fetch a action from the database.
 *
 * @param {Object} [opts] The query object
 * @param {String} [action_id] The ID of the action to get.
 */
export default function getAction(opts) {
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

      const q = `select ${values} from action where id = $1`;
      const v = [opts.action_id];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(null);
        }
      });
    });
  });
}
