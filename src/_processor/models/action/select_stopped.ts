/*
 * If the caller is interested in actions that were received on Monday but not
 * Tuesday, it should pass in Monday as the range to search.
 */

import getPgPool from "../../persistence/pg";
import { EnvironmentTimeRange } from "../../common";

const pgPool = getPgPool();

export default async function selectStopped(opts: EnvironmentTimeRange): Promise<string[]> {
  const select = `
  select action from action
  where
    project_id = $1
    and environment_id = $2
    and last_active >= $3
    and last_active < $4`;

  const results = await pgPool.query(select, [
    opts.projectId,
    opts.environmentId,
    opts.range[0].format(),
    opts.range[1].format(),
  ]);

  return results.rows.map(({ action }) => action);
}
