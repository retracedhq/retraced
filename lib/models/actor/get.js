'use strict';

const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously fetch 1 actor from the database.
 *
 * @param {string} [actor_id] The unique actor id to fetch
 */
function getActor(opts) {
  return new Promise((resolve, reject) => {
    console.log('getActors');
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = 'select * from actor where id = $1';
      const v = [opts.actor_id];
      console.log(v);
      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          console.log('Error in actor.getActor');
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
