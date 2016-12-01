import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously list environments belonging to given project
 *
 * @param {Object} [opts] The request options.
 */
export default function listEnvironments(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = "select * from environment where project_id = $1";
      pg.query(q, [opts.project_id], (qerr, result) => {
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
