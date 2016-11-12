const pgPool = require('../../persistence/pg')();
function listActions(opts) {
    return new Promise((resolve, reject) => {
        pgPool.connect((err, pg, done) => {
            if (err) {
                reject(err);
                return;
            }
            const q = `select * from action where
      project_id = $1 and
      environment_id = $2 order by action`;
            const v = [
                opts.project_id,
                opts.environment_id,
            ];
            pg.query(q, v, (qerr, result) => {
                done(true);
                if (qerr) {
                    reject(qerr);
                }
                else if (result.rowCount > 0) {
                    resolve(result.rows);
                }
                else {
                    resolve([]);
                }
            });
        });
    });
}
module.exports = listActions;
//# sourceMappingURL=list.js.map