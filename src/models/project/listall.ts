import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  user_id: string;
}

/**
 * Asynchronously returns all projects for a user from the database
 */
export default async function listAllProjects() {
  const q = `select project.* from project`;

  const result = await pgPool.query(q);

  return result.rowCount > 0 ? result.rows : [];
}
