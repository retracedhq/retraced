

const uuid = require('uuid');

const pgPool = require('../../persistence/pg')();

/**
 * Create or
 *
 * @param {Object} [opts] The request options.
 */
function upsertAction(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const action = {
        id: uuid.v4().replace(/-/g, ''),
        project_id: opts.token.project_id,
        environment_id: opts.token.environment_id,
        created: new Date().getTime(),
        first_active: new Date().getTime(),
        last_active: new Date().getTime(),
        event_count: 1,
        action: opts.action,
      };

      const q = `insert into action (
        id, created, environment_id, event_count, first_active, action, last_active, project_id
      ) values (
        $1, to_timestamp($2), $3, $4, to_timestamp($5), $6, to_timestamp($7), $8
      ) on conflict (environment_id, action) do update set 
        event_count = (select event_count from action where environment_id = $3 and action = $6) + 1,
        last_active = to_timestamp($7)
        returning *`;

      const v = [
        action.id,
        action.created / 1000,
        action.environment_id,
        action.event_count,
        action.first_active / 1000,
        action.action,
        action.last_active / 1000,
        action.project_id,
      ];

      pg.query(q, v, (qerr, result) => {
        done(true);
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

module.exports = upsertAction;
