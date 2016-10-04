'use strict';

const _ = require('lodash');

const getToken = require('../models/token/get');
const pgPool = require('../persistence/pg')();

// This currently only supports "user_id" | "token" and "project_id" in opts.
// but should be extended to support any resource.

/**
 * Asynchronously checks if a user has access to a resource.
 *
 * @param {Object} [opts] The request options
 */
function checkAccess(opts) {
  if (_.has(opts, 'user_id')) {
    return checkAccessForUser(opts);
  } else if (_.has(opts, 'token')) {
    return checkAccessForToken(opts);
  }

  return new Promise((resolve, reject) => {
    reject(new Error('must supply either user_id or token'));
  });
}

function checkAccessForToken(opts) {
  return new Promise((resolve, reject) => {
    getToken(opts.token)
    .then((token) => {
      resolve(token.project_id === opts.project_id);
    })
    .catch(reject);
  });
}

function checkAccessForUser(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const q = `select * from projectuser
        where user_id = $1 and project_id = $2`;
      const v = [
        opts.user_id,
        opts.project_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else {
          resolve(result.rowCount > 0);
        }
      });
    });
  });
}

module.exports = checkAccess;
