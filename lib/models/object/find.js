'use strict';

const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously returns an object from the database, if it exists
 *
 * @param {Object} [opts] The request options.
 * @param {Object} [opts.token] The token making the request.
 * @param {String} [opts.token.project_id] The project id.
 * @param {String} [opts.token.environment_id] The environment id.
 * @param {Object} [opts.object] The object.
 * @param {String} [opts.object.id] The object _foreign_ id.
 */
function findObject(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const q = `select * from object where
      project_id = $1 and
      environment_id = $2 and
      foreign_id = $3`;
      const v = [
        opts.token.project_id,
        opts.token.environment_id,
        opts.object.id,
      ];

      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          result.rows[0].retraced_object_type = 'object';
          resolve(result.rows[0]);
        } else {
          resolve(null);
        }
      });
    });
  });
}

module.exports = findObject;
