import getPgPool from "../../persistence/pg";
import { EnvironmentTimeRange } from "../../common";

const pgPool = getPgPool();

export default async function selectNew(opts: EnvironmentTimeRange): Promise<string[]> {
  const select = `
  select action from action
  where
    project_id = $1
    and environment_id = $2
    and first_active >= $3
    and first_active < $4`;

  const results = await pgPool.query(select, [
    opts.projectId,
    opts.environmentId,
    opts.range[0].format(),
    opts.range[1].format(),
  ]);

  return results.rows.map(({ action }) => action);
}
