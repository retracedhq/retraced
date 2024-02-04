import getPgPool from "../../persistence/pg";
import { EnvironmentTimeRange } from "../../common";

const pgPool = getPgPool();

interface GroupCount {
  group_id: string;
  action_count: number;
}

export default async function selectTop(opts: EnvironmentTimeRange): Promise<GroupCount[]> {
  const select = `
  select
      active_group.group_id,
      group_detail.name,
      count(1) AS action_count
  from active_group JOIN group_detail USING (group_id)
  where
    active_group.project_id = $1
    and active_group.environment_id = $2
    and active_group.created_at >= $3
    and active_group.created_at < $4
  group by 1, 2
  order by action_count DESC
  limit 5`;

  const results = await pgPool.query(select, [
    opts.projectId,
    opts.environmentId,
    opts.range[0].format(),
    opts.range[1].format(),
  ]);

  return results.rows.map(({ group_id, name, action_count }) => ({
    group_id,
    name,
    action_count: parseInt(action_count, 10),
  }));
}
