

const pgPool = require('../../../persistence/pg')();

/**
 * Asynchronously delete an invite from the database.
 *
 * @param {string} [id] The invite id
 */
function deleteInvite(inviteId) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = 'delete from invite where id = $1';
      const v = [inviteId];
      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else {
          resolve();
        }
      });
    });
  });
}

module.exports = deleteInvite;
