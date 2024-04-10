import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export const getByProjectEnvironmentGroupId = async (
  projectId: string,
  environmentId: string,
  groupId: string,
  offset?: number,
  limit?: number
) => {
  let q = `SELECT * FROM security_sink WHERE project_id = $1 AND environment_id = $2 AND group_id = $3`;
  const v = [projectId, environmentId, groupId];
  if (offset !== undefined && limit !== undefined) {
    v.push(offset.toString(), limit.toString());
    q += ` OFFSET $4 LIMIT $5`;
  }
  const result = await pgPool.query(q, v);
  return result.rows;
};

export const getByGroupId = async (groupId: string, offset?: number, limit?: number) => {
  const v = [groupId];
  let q = `SELECT * FROM security_sink WHERE group_id = $1`;
  if (offset !== undefined && limit !== undefined) {
    v.push(offset.toString(), limit.toString());
    q += ` OFFSET $2 LIMIT $3`;
  }
  const result = await pgPool.query(q, v);
  return result.rows;
};

export const getById = async (id: string) => {
  const q = `SELECT * FROM security_sink WHERE id = $1`;
  const result = await pgPool.query(q, [id]);
  return result.rows.length ? result.rows[0] : undefined;
};
