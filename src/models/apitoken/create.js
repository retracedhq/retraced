import "source-map-support/register";
import * as uuid from "uuid";
import * as moment from "moment";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously create a new API token with the given options
 *
 * @param {Object} [opts] The request options.
 */
export default function createApiToken(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const apiToken = {
        token: uuid.v4().replace(/-/g, ""),
        name: opts.name,
        created: moment().unix(),
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
        apiToken.token,
        apiToken.name,
        apiToken.created,
        apiToken.project_id,
        apiToken.environment_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else {
          resolve(apiToken);
        }
      });
    });
  });
}
