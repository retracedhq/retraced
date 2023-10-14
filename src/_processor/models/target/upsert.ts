import moment from "moment";
import { PoolClient } from "pg";

export default async function (opts, pg: PoolClient) {
  const target = {
    id: crypto.randomUUID().replace(/-/g, ""),
    foreign_id: opts.target.id,
    project_id: opts.projectId,
    fields: JSON.stringify(opts.target.fields),
    environment_id: opts.environmentId,
    name: opts.target.name,
    created: moment().valueOf(),
    event_count: 1,
    url: opts.target.href,
    first_active: moment().valueOf(),
    last_active: moment().valueOf(),
    type: opts.target.type,
    retraced_object_type: "target",
  };

  let onConflict = `do update set
    event_count = (select event_count from target where environment_id = $4 and foreign_id = $2) + 1,
    name        = COALESCE($5, target.name),
    fields      = COALESCE($12, target.fields),
    url         = COALESCE($9, target.url),
    last_active = to_timestamp($8::double precision / 1000)`;
  if (opts.updateOnConflict === false) {
    onConflict = "do nothing";
  }

  const q = `insert into target (
    id, foreign_id, project_id, environment_id, name, created, first_active, last_active, url, type, event_count, fields
  ) values (
  $1, $2, $3, $4, $5, to_timestamp($6::double precision / 1000), to_timestamp($7::double precision / 1000), to_timestamp($8::double precision / 1000), $9, $10, $11, $12
  ) on conflict (environment_id, foreign_id) ${onConflict}`;

  const v = [
    target.id,
    target.foreign_id,
    target.project_id,
    target.environment_id,
    target.name,
    target.created,
    target.first_active,
    target.last_active,
    target.url,
    target.type,
    target.event_count,
    target.fields,
  ];

  await pg.query(q, v);

  const fields = `id, environment_id, event_count, foreign_id, name, project_id, url, type, fields,
  extract(epoch from created) * 1000 as created,
  extract(epoch from first_active) * 1000 as first_active,
  extract(epoch from last_active) * 1000 as last_active`;
  const qq = `select ${fields} from target where environment_id = $1 and foreign_id = $2`;
  const vv = [opts.environmentId, opts.target.id];
  const result = await pg.query(qq, vv);
  if (result.rowCount > 0) {
    return result.rows[0];
  }

  return null;
}
