import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously fetch 1 actor from the database.
 *
 * @param {string} [actor_id] The unique actor id to fetch
 */
export default function getActor(opts) {
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

      const q = `select ${fields} from actor where id = $1`;
      const v = [opts.actor_id];
      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          result.rows[0].retraced_object_type = "actor";
          resolve(result.rows[0]);
        } else {
          resolve(null);
        }
      });
    });
  });
}
