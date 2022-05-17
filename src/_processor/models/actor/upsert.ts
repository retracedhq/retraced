import "source-map-support/register";
import * as uuid from "uuid";
import moment from "moment";
import { PoolClient } from "pg";

export default async function(opts, pg: PoolClient) {
  const actor = {
    id: uuid.v4().replace(/-/g, ""),
    foreign_id: opts.actor.id,
    project_id: opts.projectId,
    environment_id: opts.environmentId,
    name: opts.actor.name,
    url: opts.actor.href,
    fields: JSON.stringify(opts.actor.fields),
    created: moment().valueOf(),
    event_count: 1,
    first_active: moment().valueOf(),
    last_active: moment().valueOf(),
    retraced_object_type: "actor",
  };

  let onConflict = `do update set
    event_count = (select event_count from actor where environment_id = $4 and foreign_id = $2) + 1,
    last_active = to_timestamp($8::double precision / 1000),
    name        = COALESCE($5, actor.name),
    fields      = COALESCE($11, actor.fields),
    url         = COALESCE($10, actor.url)`;
  if (opts.updateOnConflict === false) {
    onConflict = "do nothing";
  }

  const q = `insert into actor (
    id, foreign_id, project_id, environment_id, name, created, first_active, last_active, event_count, url, fields
  ) values (
  $1, $2, $3, $4, $5, to_timestamp($6::double precision / 1000), to_timestamp($7::double precision / 1000), to_timestamp($8::double precision / 1000), $9, $10, $11
  ) on conflict (environment_id, foreign_id) ${onConflict}`;

  const v = [
    actor.id,
    actor.foreign_id,
    actor.project_id,
    actor.environment_id,
    actor.name,
    actor.created,
    actor.first_active,
    actor.last_active,
    actor.event_count,
    actor.url,
    actor.fields,
  ];

  await pg.query(q, v);

  const fields = `id, environment_id, event_count, foreign_id, name, project_id, url, fields,
  extract(epoch from created) * 1000 as created,
  extract(epoch from first_active) * 1000 as first_active,
  extract(epoch from last_active) * 1000 as last_active`;
  const qq = `select ${fields} from actor where environment_id = $1 and foreign_id = $2`;
  const vv = [opts.environmentId, opts.actor.id];
  const result = await pg.query(qq, vv);
  if (result.rowCount > 0) {
    return result.rows[0];
  }

  return null;
}
