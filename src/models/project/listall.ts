import { is_numeric } from "../../common/helpers";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  offset: string;
  limit: string;
}

/**
 * Asynchronously returns all projects for a user from the database
 */
export default async function listAllProjects(opts: Options) {
  const q =
    opts.offset && opts.limit
      ? `select project.* from project order by created desc offset $1 limit $2`
      : `select project.* from project`;
  const v = is_numeric(opts.offset) && is_numeric(opts.limit) ? [Number(opts.offset), Number(opts.limit)] : [];
  const result = await pgPool.query(q, v);

  return result.rowCount > 0 ? result.rows : [];
}
