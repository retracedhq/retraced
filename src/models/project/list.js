import * as _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously returns all projects for a user from the database
 *
 * @param {Object} [opts] The request options.
 */
export default function listProjects(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = `select project.* from project
        inner join projectuser
        on project.id = projectuser.project_id
        where projectuser.user_id = $1`;
      const v = [
        opts.user_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done();
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
