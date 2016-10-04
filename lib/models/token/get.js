'use strict';

const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously fetch a token from the database.
 *
 * @param {string} [token] The token
 */
function getToken(token) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const q = 'select * from token where token = $1';
      const v = [token];

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

module.exports = getToken;
