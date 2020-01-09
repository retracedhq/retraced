import "source-map-support/register";
import * as moment from "moment";
import { PoolClient } from "pg";

export default async function(opts, pg: PoolClient) {
  const now = moment().valueOf();

  let onConflict = `do update set
    event_count = (select event_count from group_detail where environment_id = $3 and group_id = $4) + 1,
    name = COALESCE($5, group_detail.name),
    last_active = to_timestamp($1::double precision / 1000)`;
  if (opts.updateOnConflict === false) {
    onConflict = "do nothing";
  }

  const q = `insert into group_detail (
    created_at, project_id, environment_id, group_id, name, last_active, event_count
  ) values (
  to_timestamp($1::double precision / 1000), $2, $3, $4, $5, to_timestamp($1::double precision / 1000), 1
  ) on conflict (environment_id, group_id) ${onConflict}`;

  const v = [
    now,
    opts.projectId,
    opts.environmentId,
    opts.group.id,
    opts.group.name,
  ];

  await pg.query(q, v);

  const fields = `project_id, environment_id, group_id, name, event_count,
  extract(epoch from created_at) * 1000 as created_at,
  extract(epoch from last_active) * 1000 as last_active`;
  const qq = `select ${fields} from group_detail where environment_id = $1 and group_id = $2`;
  const vv = [opts.environmentId, opts.group.id];
  const result = await pg.query(qq, vv);
  if (result.rowCount > 0) {
    return result.rows[0];
  }

  return null;
}
