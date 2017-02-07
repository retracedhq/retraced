import "source-map-support/register";
import * as _ from "lodash";

import getApiToken from "../models/apitoken/get";
import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

// This currently only supports "user_id" | "token" and "project_id" in opts.
// but should be extended to support any resource.

/**
 * Asynchronously checks if a user has access to a resource.
 *
 * @param {Object} [opts] The request options
 */
export default function checkAccess(opts) {
  if (_.has(opts, "user_id")) {
    return checkAccessForUser(opts);
  } else if (_.has(opts, "api_token")) {
    return checkAccessForApiToken(opts);
  }

  return new Promise((resolve, reject) => {
    reject(new Error("must supply either user_id or api_token"));
  });
}

function checkAccessForApiToken(opts) {
  return new Promise((resolve, reject) => {
    getApiToken(opts.api_token.token)
    .then((apiToken) => {
      resolve(apiToken && apiToken.project_id === opts.project_id);
    })
    .catch(reject);
  });
}

function checkAccessForUser(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = `select * from projectuser
        where user_id = $1 and project_id = $2`;
      const v = [
        opts.user_id,
        opts.project_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else {
          resolve(result.rowCount > 0);
        }
      });
    });
  });
}
