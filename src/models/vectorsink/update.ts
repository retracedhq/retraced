import nsq from "../../persistence/nsq";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function update(id, data) {
  let q = `SELECT * FROM vectorsink WHERE id = $1`;
  let v = [id];
  const existing = await pgPool.query(q, v);
  if (existing.rows.length === 0) {
    return false;
  } else {
    const sink = existing.rows[0];
    const update = {
      project_id: data.projectId || sink.project_id,
      environment_id: data.environmentId || sink.environment_id,
      group_id: data.groupId || sink.group_id,
      name: data.name || sink.name,
      config: data.config || sink.config,
      active: data.active || sink.active,
    };
    q = `UPDATE vectorsink SET name = $1, config = $2, active = $3, 
        project_id = $4, environment_id = $5, group_id = $6 WHERE id = $7`;
    v = [update.name, update.config, false, update.project_id, update.environment_id, update.group_id, id];
    await pgPool.query(q, v);
    nsq.produce("sink_updated", JSON.stringify({ id }));
    return true;
  }
}
