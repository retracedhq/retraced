import { is_numeric } from "../../common/helpers";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  user_id: string;
  offset: string;
  limit: string;
}

/**
 * Asynchronously returns all projects for a user from the database
 */
export default async function listProjects(opts: Options) {
  const q =
    is_numeric(opts.offset) && is_numeric(opts.limit)
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
    is_numeric(opts.offset) && is_numeric(opts.limit)
      ? [opts.user_id, Number(opts.offset), Number(opts.limit)]
      : [opts.user_id];

  const result = await pgPool.query(q, v);

  return result.rowCount > 0 ? result.rows : [];
}
