import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously returns an actor from the database, if it exists
 *
 * @param {Object} [opts] The request options.
 */
export default function findActor(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = `select * from actor where
      project_id = $1 and
      environment_id = $2 and
      foreign_id = $3`;
      const v = [
        opts.token.project_id,
        opts.token.environment_id,
        opts.actor.id,
      ];

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
