const pgPool = require('../../persistence/pg')();
function getUser(opts) {
    return new Promise((resolve, reject) => {
        pgPool.connect((err, pg, done) => {
            if (err) {
                reject(err);
                return;
            }
            const q = 'select * from retraceduser where email = $1';
            const v = [opts.email];
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
module.exports = getUser;
//# sourceMappingURL=get.js.map