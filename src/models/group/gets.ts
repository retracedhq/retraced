import _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously fetch >= 1 group(s) from the database.
 *
 * param {string} [group_ids] The unique group id(s) to fetch
 */
export default async function (opts) {
  if (opts.group_ids.length === 0) {
    return [];
  }

  const pg = await pgPool.connect();
  try {
    const tokenList = _.map(opts.group_ids, (gid, i) => {
      return `$${i + 1}`;
    });
    const fields = `project_id, environment_id, group_id, name, event_count,
        extract(epoch from created_at) * 1000 as created_at,
        extract(epoch from last_active) * 1000 as last_active`;

    const q = `select ${fields} from group_detail where group_id in (${tokenList})`;
    const v = opts.group_ids;
    const result = await pg.query(q, v);
    if (result.rowCount) {
      return result.rows;
    }
    return [];
  } finally {
    pg.release();
  }
}
