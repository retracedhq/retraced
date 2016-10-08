'use strict';

const uuid = require('uuid');

const pgPool = require('../../persistence/pg')();

/**
 * Create or
 *
 * @param {Object} [opts] The request options.
 */
function upsertActor(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const actor = {
        id: uuid.v4().replace(/-/g, ''),
        foreign_id: opts.actor.id,
        project_id: opts.token.project_id,
        environment_id: opts.token.environment_id,
        name: opts.actor.name,
        created: new Date().getTime(),
        event_count: 1,
        first_active: new Date().getTime(),
        last_active: new Date().getTime(),
        retraced_object_type: 'actor',
      };

      const q = `insert into actor (
      id, foreign_id, project_id, environment_id, name, created, first_active, last_active, event_count
    ) values (
      $1, $2, $3, $4, $5, to_timestamp($6), to_timestamp($7), to_timestamp($8), $9
    ) on conflict (environment_id, foreign_id) do update set 
        event_count = (select event_count from actor where environment_id = $4 and foreign_id = $2) + 1,
        last_active = to_timestamp($8)
        returning *`;
      const v = [
        actor.id,
        actor.foreign_id,
        actor.project_id,
        actor.environment_id,
        actor.name,
        actor.created / 1000,
        actor.first_active / 1000,
        actor.last_active / 1000,
        actor.event_count
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

module.exports = upsertActor;
