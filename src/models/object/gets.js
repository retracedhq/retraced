

const pgPool = require('../../persistence/pg')();
const _ = require('lodash');

/**
 * Asynchronously fetch >=1 object(s) from the database.
 *
 * @param {string} [object_ids] The unique object id(s) to fetch
 */
function getObjects(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const tokenList = _.map(opts.object_ids, (a, i) => { return `$${i + 1}`; });
      const q = `select * from object where id in (${tokenList})`;
      const v = opts.object_ids;
      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          _.forEach(result.rows, (row) => {
            row.retraced_object_type = 'object';
          });
          resolve(result.rows);
        } else {
          resolve(null);
        }
      });
    });
  });
}

module.exports = getObjects;
