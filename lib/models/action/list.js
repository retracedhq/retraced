'use strict';

const pgPool = require('../../persistence/pg')();

/**
 * listActions returns a Promise that retrieves all of the actions for
 * a given project and environment
 *
 * @param {Object} [opts] The request options
 * @param {string} [opts.project_id] The project id to query
 * @param {string} [opts.environment_id] The environment id to query
 */
function listActions(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const q = `select * from action where
      project_id = $1 and
      environment_id = $2`;
      const v = [
        opts.project_id,
        opts.environment_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          resolve(result.rows);
        } else {
          resolve([]);
        }
      });
    });
  });
}

module.exports = listActions;
