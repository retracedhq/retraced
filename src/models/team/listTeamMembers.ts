import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

// projectId
export default function listTeamMembers(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      if (!pg) {
        reject(new Error("Couldn't connect to postgres"));
        return;
      }

      const q = `
      select
        retraceduser.id, retraceduser.created, retraceduser.email, retraceduser.last_login,
        retraceduser.timezone, retraceduser.tx_emails_recipient
      from
        retraceduser
      inner join
        projectuser on retraceduser.id = projectuser.user_id
      where
        projectuser.project_id = $1
      `;
      const v = [opts.projectId];

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
