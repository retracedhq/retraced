const pgPool = require('../../persistence/pg')();
function findObject(opts) {
    return new Promise((resolve, reject) => {
        pgPool.connect((err, pg, done) => {
            if (err) {
                reject(err);
                return;
            }
            const q = `select * from object where
      project_id = $1 and
      environment_id = $2 and
      foreign_id = $3`;
            const v = [
                opts.token.project_id,
                opts.token.environment_id,
                opts.object.id,
            ];
            pg.query(q, v, (qerr, result) => {
                done(true);
                if (qerr) {
                    reject(qerr);
                }
                else if (result.rowCount > 0) {
                    result.rows[0].retraced_object_type = 'object';
                    resolve(result.rows[0]);
                }
                else {
                    resolve(null);
                }
            });
        });
    });
}
module.exports = findObject;
//# sourceMappingURL=find.js.map