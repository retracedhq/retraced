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

      let q;
      let v;
      if (opts.email) {
        q = "select * from retraceduser where email = $1";
        v = [opts.email];
      } else if (opts.externalAuthId) {
        q = "select * from retraceduser where external_auth_id = $1";
        v = [opts.externalAuthId];
      }

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
