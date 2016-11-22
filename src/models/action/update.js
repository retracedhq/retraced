const uuid = require("uuid");

const pgPool = require("../../persistence/pg")();

/**
 * Updates an action in the database
 *
 * @param {Object} [opts] The request options.
 * @param {String} [opts.action_id] The id of the action to update.
 * @param {String} [opts.display_template] The display_template to apply.
 */
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
        opts.action_i,
      ];

      pg.query(q, v, (qerr, result) => {
        done();
        if (qerr) {
          reject(qerr);
        } else if (result.rowCount > 0) {
          resolve(result.rows[0]);
        } else {
          resolve(null);
        }
      });
    });
  });
}

module.exports = updateAction;
