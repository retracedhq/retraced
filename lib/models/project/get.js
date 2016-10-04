'use strict';

const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously fetch a project from the database.
 *
 * @param {string} [projectId] The project ID
 */
function getProject(projectId) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const q = 'select * from project where id = $1';
      const v = [projectId];
      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(null);
        }
      });
    });
  });
}

module.exports = getProject;
