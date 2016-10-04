'use strict';

const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously fetch a actor from the database.
 *
 * @param {string} [token] The token
 */
function getActor(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const q = 'select * from actor where id = $1';
      const v = [opts.actor_id];

      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          result.rows[0].retraced_object_type = 'actor';
          resolve(result.rows[0]);
        } else {
          resolve(null);
        }
      });
    });
  });
}

module.exports = getActor;
