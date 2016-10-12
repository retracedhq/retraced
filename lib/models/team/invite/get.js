'use strict';

const pgPool = require('../../../persistence/pg')();

/**
 * Asynchronously fetch an invite from the database.
 *
 * @param {string} [id] The invite id
 */
function getInvite(inviteId) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = 'select * from invite where id = $1';
      const v = [inviteId];

      pg.query(q, v, (qerr, result) => {
        done(true);
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

module.exports = getInvite;
