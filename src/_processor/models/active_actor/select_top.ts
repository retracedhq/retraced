import getPgPool from "../../persistence/pg";
import { EnvironmentTimeRange } from "../../common";

const pgPool = getPgPool();

interface ActorCount {
  actor_id: string;
  action_count: number;
}

export default async function selectTop(
  opts: EnvironmentTimeRange
): Promise<ActorCount[]> {
  const select = `
  select
      active_actor.actor_id,
      actor.name,
      count(1) AS action_count
  from active_actor
  JOIN actor ON actor.id = active_actor.actor_id
  where
    active_actor.project_id = $1
    and active_actor.environment_id = $2
    and active_actor.created_at >= $3
    and active_actor.created_at < $4
  group by actor_id, name
  order by action_count DESC
  limit 5`;

  const results = await pgPool.query(select, [
    opts.projectId,
    opts.environmentId,
    opts.range[0].format(),
    opts.range[1].format(),
  ]);

  return results.rows.map(({ actor_id, name, action_count }) => ({
    actor_id,
    name,
    action_count: parseInt(action_count, 10),
  }));
}
