const _ = require('lodash');
const pgPool = require('../../persistence/pg')();
const gets = require('./gets');
function listActors(opts) {
    if (opts.actor_ids && opts.actor_ids.length > 0) {
        return gets(opts);
    }
    return listActorsForProjectAndEnvironment(opts.project_id, opts.environment_id);
}
function listActorsForProjectAndEnvironment(projectId, environmentId) {
    return new Promise((resolve, reject) => {
        pgPool.connect((err, pg, done) => {
            if (err) {
                reject(err);
                return;
            }
            const q = `select * from actor where
      project_id = $1 and
      environment_id = $2`;
            const v = [
                projectId,
                environmentId,
            ];
            pg.query(q, v, (qerr, result) => {
                done(true);
                if (qerr) {
                    reject(qerr);
                }
                else if (result.rowCount > 0) {
                    resolve(_.map(result.rows, (row) => {
                        row.retraced_object_type = 'actor';
                        return row;
                    }));
                }
                else {
                    resolve([]);
                }
            });
        });
    });
}
module.exports = listActors;
//# sourceMappingURL=list.js.map