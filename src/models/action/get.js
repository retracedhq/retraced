

const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously fetch a action from the database.
 *
 * @param {Object} [opts] The query object
 * @param {String} [action_id] The ID of the action to get.
 */
function getAction(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = 'select * from action where id = $1';
      const v = [opts.action_id];

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

module.exports = getAction;
