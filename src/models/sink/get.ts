import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export const getByProjectEnvironmentGroupId = async (
  projectId: string,
  environmentId: string,
  groupId: string
) => {
  const q = `SELECT * FROM sink WHERE project_id = $1 AND environment_id = $2 AND group_id = $3`;
  const result = await pgPool.query(q, [projectId, environmentId, groupId]);
  return result.rows;
};

export const getByGroupId = async (groupId: string) => {
  const q = `SELECT * FROM sink WHERE group_id = $1`;
  const result = await pgPool.query(q, [groupId]);
  return result.rows;
};

export const getById = async (id: string) => {
  const q = `SELECT * FROM sink WHERE id = $1`;
  const result = await pgPool.query(q, [id]);
  return result.rows.length ? result.rows[0] : undefined;
};