import "source-map-support/register";

import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export default async function saveActiveActor(job) {
  const jobObj = JSON.parse(job.body);
  const actorId = jobObj.event.actor && jobObj.event.actor.id;

  if (!actorId) {
    return;
  }

  const q = `insert into active_actor (
    created_at, project_id, environment_id, actor_id
  ) values (
    to_timestamp($1::double precision / 1000), $2, $3, $4
  )`;
  const v = [
    jobObj.event.canonical_time,
    jobObj.projectId,
    jobObj.environmentId,
    actorId,
  ];
  try {
    await pgPool.query(q, v);
  } catch (e) {
    e.retry = true;
    throw e;
  }
}
