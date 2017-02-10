import "source-map-support/register";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously returns the entire group for a project
 *
 * @param {Object} [opts] The request options.
 */
export default function listGroup(opts) {
  return new Promise((resolve, reject) => {
    const promises = [];
    promises.push(listGroupMembers(opts));
    promises.push(listGroupInvites(opts));

    Promise.all(promises)
      .then((values) => {
        const result = {
          members: values[0],
          invites: values[1],
        };

        resolve(result);
      })
      .catch(reject);
  });
}

function listGroupInvites(opts) {
  return new Promise((resolve, reject) => {
    resolve({});
  });
}

function listGroupMembers(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = `select retraceduser.* from retraceduser
        inner join projectuser
        on retraceduser.id = projectuser.user_id
        where projectuser.project_id = $1`;
      const v = [opts.project_id];

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
