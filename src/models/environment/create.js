

const config = require('../../config/getConfig')();
const pgPool = require('../../persistence/pg')();

/**
 * Asynchronously create a new environment with the given options
 *
 * @param {Object} [opts] The request options.
 */
function createEnvironment(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const environment = {
        // TODO(zhaytee): Probably should generate the id here instead of getting it passed in...
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
        done();
        if (qerr) {
          reject(qerr);
        } else {
          resolve(environment);
        }
      });
    });
  });
}

module.exports = createEnvironment;
