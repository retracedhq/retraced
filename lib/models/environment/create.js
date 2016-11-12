const config = require('../../config/getConfig')();
const pgPool = require('../../persistence/pg')();
function createEnvironment(opts) {
    return new Promise((resolve, reject) => {
        pgPool.connect((err, pg, done) => {
            if (err) {
                reject(err);
                return;
            }
            const environment = {
                id: opts.id,
                name: opts.name,
                project_id: opts.project_id,
            };
            const q = `insert into environment (
        id, name, project_id
      ) values (
        $1, $2, $3
      )`;
            const v = [
                environment.id,
                environment.name,
                environment.project_id,
            ];
            pg.query(q, v, (qerr, result) => {
                done(true);
                if (qerr) {
                    reject(qerr);
                }
                else {
                    resolve(environment);
                }
            });
        });
    });
}
module.exports = createEnvironment;
//# sourceMappingURL=create.js.map