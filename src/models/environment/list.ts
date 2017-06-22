import "source-map-support/register";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
    projectId: string;
}

/**
 * Asynchronously list environments belonging to given project
 */
export default async function listEnvironments(opts: Options) {
    const q = "select * from environment where project_id = $1";
    const result = await pgPool.query(q, [opts.projectId]);
    const rows = result.rowCount > 0 ? result.rows : [];

    return rows;
}
