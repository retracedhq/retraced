import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function update(
  id: string,
  data: {
    projectId?: string;
    environmentId?: string;
    groupId?: string;
    name?: string;
    config?: string;
    active?: boolean;
  }
) {
  let q = `SELECT * FROM sink WHERE id = $1`;
  let v = [id];
  const existing = await pgPool.query(q, v);
  if (existing.rows.length === 0) {
    throw new Error("Sink not found");
  } else if (existing.rows[0].project_id !== data.projectId) {
    throw new Error("Sink does not belong to the project");
  } else if (existing.rows[0].environment_id !== data.environmentId) {
    throw new Error("Sink does not belong to the environment");
  } else if (existing.rows[0].group_id !== data.groupId) {
    throw new Error("Sink does not belong to the group");
  } else {
    const sink = existing.rows[0];
    const opts = {
      project_id: data.projectId || sink.project_id,
      environment_id: data.environmentId || sink.environment_id,
      group_id: data.groupId || sink.group_id,
      name: data.name || sink.name,
      config: data.config || sink.config,
      active: data.active || sink.active,
    };
    q = `UPDATE sink SET name = $1, config = $2, active = $3, 
        project_id = $4, environment_id = $5, group_id = $6 WHERE id = $7`;
    v = [opts.name, opts.config, false, opts.project_id, opts.environment_id, opts.group_id, id];
    await pgPool.query(q, v);
    return true;
  }
}
