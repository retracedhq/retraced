const uuid = require('uuid');
const pgPool = require('../../persistence/pg')();
function createApiToken(opts) {
    return new Promise((resolve, reject) => {
        pgPool.connect((err, pg, done) => {
            if (err) {
                reject(err);
                return;
            }
            const apiToken = {
                token: uuid.v4().replace(/-/g, ''),
                name: opts.name,
                created: new Date().getTime(),
                project_id: opts.project_id,
                environment_id: opts.environment_id,
                disabled: 0,
            };
            const q = `insert into token (
        token, name, created, project_id, environment_id
      ) values (
        $1, $2, to_timestamp($3), $4, $5
      )`;
            const v = [
                apiToken.token,
                apiToken.name,
                apiToken.created / 1000,
                apiToken.project_id,
                apiToken.environment_id,
            ];
            pg.query(q, v, (qerr, result) => {
                done(true);
                if (qerr) {
                    reject(qerr);
                }
                else {
                    resolve(apiToken);
                }
            });
        });
    });
}
module.exports = createApiToken;
//# sourceMappingURL=create.js.map