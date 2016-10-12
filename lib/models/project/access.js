'use strict';

const uuid = require('uuid');

const pgPool = require('../../persistence/pg')();

function addUserToProject(projectId, userId) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const projectuser = {
        id: uuid.v4().replace(/-/g, ''),
        project_id: projectId,
        user_id: userId,
      };

      const q = `insert into projectuser (
        id, project_id, user_id
      ) values (
        $1, $2, $3
      )`;
      const v = [
        projectuser.id,
        projectuser.project_id,
        projectuser.user_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done(true);
        if (qerr) {
          reject(qerr);
        } else {
          resolve();
        }
      });
    });
  });
}

module.exports = {
  'addUserToProject': addUserToProject,
};
