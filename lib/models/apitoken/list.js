'use strict';

const _ = require('lodash');

const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously returns all tokens for a project from the database
 *
 * @param {Object} [opts] The request options.
 */
function listApiTokens(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const q = 'select * from token where project_id = $1';
      const v = [opts.project_id];

      pg.query(q, v, (qerr, queryResult) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else if (queryResult.rowCount > 0) {
          resolve(queryResult.rows);
        } else {
          resolve([]);
        }
      });
    });
  });
}

module.exports = listApiTokens;
