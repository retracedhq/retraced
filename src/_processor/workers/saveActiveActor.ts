import getPgPool from "../../persistence/pg";
import type { Job } from "./normalizeEvent";

const pgPool = getPgPool();

export default async function saveActiveActor(job: Job) {
  const actorId = job.event.actor && job.event.actor.id;

  if (!actorId) {
    return;
  }

  const q = `insert into active_actor (
    created_at, project_id, environment_id, actor_id
  ) values (
    to_timestamp($1::double precision / 1000), $2, $3, $4
  )`;

  const v = [job.event.canonical_time, job.projectId, job.environmentId, actorId];

  try {
    await pgPool.query(q, v);
  } catch (e) {
    e.retry = true;
    throw e;
  }
}
