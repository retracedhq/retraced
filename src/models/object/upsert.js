import * as uuid from "uuid";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Create or
 *
 * @param {Object} [opts] The request options.
 */
export default function upsertActor(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const object = {
        id: uuid.v4().replace(/-/g, ""),
        foreign_id: opts.object.id,
        project_id: opts.token.project_id,
        environment_id: opts.token.environment_id,
        name: opts.object.name,
        created: new Date().getTime(),
        event_count: 1,
        url: opts.object.url,
        first_active: new Date().getTime(),
        last_active: new Date().getTime(),
        type: opts.object.type,
        retraced_object_type: "object",
      };

      const q = `insert into object (
      id, foreign_id, project_id, environment_id, name, created, first_active, last_active, url, type, event_count
    ) values (
      $1, $2, $3, $4, $5, to_timestamp($6), to_timestamp($7), to_timestamp($8), $9, $10, $11
    ) on conflict (environment_id, foreign_id) do update set 
        event_count = (select event_count from object where environment_id = $4 and foreign_id = $2) + 1,
        last_active = to_timestamp($8)
        returning *`;
      const v = [
        object.id,
        object.foreign_id,
        object.project_id,
        object.environment_id,
        object.name,
        object.created / 1000,
        object.first_active / 1000,
        object.last_active / 1000,
        object.url,
        object.type,
        object.event_count,
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
