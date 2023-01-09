import * as uuid from "uuid";
import moment from "moment";
import { PoolClient } from "pg";

export default async function (opts, pg: PoolClient) {
  const action = {
    id: uuid.v4().replace(/-/g, ""),
    project_id: opts.projectId,
    environment_id: opts.environmentId,
    created: moment().valueOf(),
    first_active: moment().valueOf(),
    last_active: moment().valueOf(),
    event_count: 1,
    action: opts.action,
  };

  let onConflict = `do update set
    event_count = (select event_count from action where environment_id = $3 and action = $6) + 1,
    last_active = to_timestamp($7::double precision / 1000)`;
  if (opts.updateOnConflict === false) {
    onConflict = "do nothing";
  }

  const q = `insert into action (
    id, created, environment_id, event_count, first_active, action, last_active, project_id
  ) values (
  $1, to_timestamp($2::double precision / 1000), $3, $4, to_timestamp($5::double precision / 1000), $6, to_timestamp($7::double precision / 1000), $8
  ) on conflict (environment_id, action) ${onConflict}`;

  const v = [
    action.id,
    action.created,
    action.environment_id,
    action.event_count,
    action.first_active,
    action.action,
    action.last_active,
    action.project_id,
  ];

  await pg.query(q, v);

  const fields = `id, environment_id, event_count, action, project_id, display_template,
  extract(epoch from created) * 1000 as created,
  extract(epoch from first_active) * 1000 as first_active,
  extract(epoch from last_active) * 1000 as last_active`;
  const qq = `select ${fields} from action where environment_id = $1 and action = $2`;
  const vv = [opts.environmentId, opts.action];
  const result = await pg.query(qq, vv);
  if (result.rowCount > 0) {
    return result.rows[0];
  }

  return null;
}
