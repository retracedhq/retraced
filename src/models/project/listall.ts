import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

/**
 * Asynchronously returns all projects for a user from the database
 */
export default async function listAllProjects() {
  const q = `select project.* from project`;

  const result = await pgPool.query(q);

  return result.rowCount > 0 ? result.rows : [];
}
