import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously fetch a token from the database.
 *
 * @param {string} [token] The token
 */
export default function getApiToken(token) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = "select * from token where token = $1";
      const v = [token];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          resolve(result.rows[0]);
        } else {
          reject(new Error("Token not found"));
        }
      });
    });
  });
}
