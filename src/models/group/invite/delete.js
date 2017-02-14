import getPgPool from "../../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously delete an invite from the database.
 *
 * @param {string} [id] The invite id
 */
export default function deleteInvite(inviteId) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = "delete from invite where id = $1";
      const v = [inviteId];
      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else {
          resolve();
        }
      });
    });
  });
}
