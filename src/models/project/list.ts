import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  user_id: string;
  page: string;
  count: string;
}

/**
 * Asynchronously returns all projects for a user from the database
 */
export default async function listProjects(opts: Options) {
  const q =
    opts.page && opts.count
      ? `select project.* from project
    inner join projectuser
    on project.id = projectuser.project_id
    where projectuser.user_id = $1
    order by project.created desc offset $2 limit $3`
      : `select project.* from project
    inner join projectuser
    on project.id = projectuser.project_id
    where projectuser.user_id = $1`;
  const v =
    opts.page && opts.count
      ? [opts.user_id, Number(opts.page) > 1 ? (Number(opts.page) - 1) * Number(opts.count) : 0, Number(opts.count)]
      : [opts.user_id];

  const result = await pgPool.query(q, v);

  return result.rowCount > 0 ? result.rows : [];
}
