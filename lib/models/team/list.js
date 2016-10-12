'use strict';

const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously returns the entire team for a project
 *
 * @param {Object} [opts] The request options.
 */
function listTeam(opts) {
  return new Promise((resolve, reject) => {
    const promises = [];
    promises.push(listTeamMembers(opts));
    promises.push(listTeamInvites(opts));

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

function listTeamInvites(opts) {
  return new Promise((resolve, reject) => {
    resolve({});
  });
}

function listTeamMembers(opts) {
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

module.exports = listTeam;
