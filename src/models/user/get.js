import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * getUser Async fetch of user by email address
 *
 * @param {Object} [opts] the request options
 * @param {string} [opts.email] the email address to use
 */
export default function getUser(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = "select * from retraceduser where email = $1";
      const v = [opts.email];
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
