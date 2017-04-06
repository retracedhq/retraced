import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

// inviteId, projectId
export default function deleteInvite(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const q = "delete from invite where id = $1 and project_id = $2";
      const v = [opts.inviteId, opts.projectId];
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
