'use strict';

const pgPool = require('../../persistence/pg')();

/**
 * getUser Async fetch of user by email address
 *
 * @param {Object} [opts] the request options
 * @param {string} [opts.email] the email address to use
 */
function getUser(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const q = 'select * from retraceduser where email = $1';
      const v = [opts.email];
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

module.exports = getUser;
