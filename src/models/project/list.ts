
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  user_id: string;
}

/**
 * Asynchronously returns all projects for a user from the database
 */
export default async function listProjects(opts: Options) {
  const q = `select project.* from project
    inner join projectuser
    on project.id = projectuser.project_id
    where projectuser.user_id = $1`;
  const v = [
    opts.user_id,
  ];

  const result = await pgPool.query(q, v);

  return result.rowCount > 0 ? result.rows : [] ;
}
