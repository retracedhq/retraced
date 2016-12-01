import * as uuid from "uuid";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export function addUserToProject(projectId, userId) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const projectuser = {
        id: uuid.v4().replace(/-/g, ""),
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
        done();
        if (qerr) {
          reject(qerr);
        } else {
          resolve();
        }
      });
    });
  });
}
