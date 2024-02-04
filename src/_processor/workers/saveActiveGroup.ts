import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export default async function saveActiveGroup(job) {
  const jobObj = JSON.parse(job.body);
  const groupId = jobObj.event.group && jobObj.event.group.id;

  if (!groupId) {
    return;
  }

  const q = `insert into active_group (
    created_at, project_id, environment_id, group_id
  ) values (
    to_timestamp($1::double precision / 1000), $2, $3, $4
  )`;
  const v = [jobObj.event.canonical_time, jobObj.projectId, jobObj.environmentId, groupId];
  try {
    await pgPool.query(q, v);
  } catch (e) {
    e.retry = true;
    throw e;
  }
}
