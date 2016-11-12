const uuid = require('uuid');
const pgPool = require('../../persistence/pg')();
function updateAction(opts) {
    return new Promise((resolve, reject) => {
        pgPool.connect((err, pg, done) => {
            if (err) {
                reject(err);
                return;
            }
            const q = `update action set display_template = $1 where id = $2 returning *`;
            const v = [
                opts.display_template,
                opts.action_id
            ];
            pg.query(q, v, (qerr, result) => {
                done(true);
                if (qerr) {
                    reject(qerr);
                }
                else if (result.rowCount > 0) {
                    resolve(result.rows[0]);
                }
                else {
                    resolve(null);
                }
            });
        });
    });
}
module.exports = updateAction;
//# sourceMappingURL=update.js.map