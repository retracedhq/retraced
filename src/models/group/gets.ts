import "source-map-support/register";
import * as _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously fetch >=1 group(s) from the database.
 *
 * @param {string} [group_ids] The unique group id(s) to fetch
 */
export default async function (opts) {
  if (opts.group_ids.length === 0) {
    return [];
  }

  const pg = pgPool.connect();
  try {
    const tokenList = _.map(opts.group_ids, (gid, i) => { return `$${i + 1}`; });
    const q = `select * from group_detail where id in (${tokenList})`;
    const v = opts.group_ids;
    const result = await pg.query(q, v);
    if (result.rowCount > 0) {
      return result.rows;
    }
    return null;

  } finally {
    pg.release();
  }
}
