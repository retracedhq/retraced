const _ = require('lodash');
const pgPool = require('../../persistence/pg')();
const gets = require('./gets');
function listObjects(opts) {
    if (opts.object_ids && opts.object_ids.length > 0) {
        return gets(opts);
    }
    return listObjectsForProjectAndEnvironment(opts.project_id, opts.environment_id);
}
function listObjectsForProjectAndEnvironment(projectId, environmentId) {
    return new Promise((resolve, reject) => {
        pgPool.connect((err, pg, done) => {
            if (err) {
                reject(err);
                return;
            }
            const q = `select * from object where
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
                        row.retraced_object_type = 'object';
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
module.exports = listObjects;
//# sourceMappingURL=list.js.map