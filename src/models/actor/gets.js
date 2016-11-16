

const pgPool = require('../../persistence/pg')();
const _ = require('lodash');

/**
 * Asynchronously fetch >=1 actor(s) from the database.
 *
 * @param {string} [actor_ids] The unique actor id(s) to fetch
 */
function getActors(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const tokenList = _.map(opts.actor_ids, (a, i) => { return `$${i + 1}`; });
      const q = `select * from actor where id in (${tokenList})`;
      const v = opts.actor_ids;
      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          _.forEach(result.rows, (row) => {
            row.retraced_object_type = 'actor';
          });
          resolve(result.rows);
        } else {
          resolve(null);
        }
      });
    });
  });
}

module.exports = getActors;
