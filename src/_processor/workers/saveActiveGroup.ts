import getPgPool from "../../persistence/pg";
import type { Job } from "./normalizeEvent";

const pgPool = getPgPool();

export default async function saveActiveGroup(job: Job) {
  const groupId = job.event.group && job.event.group.id;

  if (!groupId) {
    return;
  }

  const q = `insert into active_group (
    created_at, project_id, environment_id, group_id
  ) values (
    to_timestamp($1::double precision / 1000), $2, $3, $4
  )`;

  const v = [job.event.canonical_time, job.projectId, job.environmentId, groupId];

  try {
    await pgPool.query(q, v);
  } catch (e) {
    e.retry = true;
    throw e;
  }
}
