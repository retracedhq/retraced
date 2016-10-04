'use strict';

const uuid = require('uuid');

const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously create a new token with the given options
 *
 * @param {Object} [opts] The request options.
 */
function createToken(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const token = {
        token: uuid.v4().replace(/-/g, ''),
        name: opts.name,
        created: new Date().getTime(),
        project_id: opts.project_id,
        environment_id: opts.environment_id,
        disabled: 0,
      };

      const q = `insert into token (
        token, name, created, project_id, environment_id
      ) values (
        $1, $2, to_timestamp($3), $4, $5
      )`;
      const v = [
        token.token,
        token.name,
        token.created,
        token.project_id,
        token.environment_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else {
          resolve(token);
        }
      });
    });
  });
}

module.exports = createToken;
