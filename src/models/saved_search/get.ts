import "source-map-support/register";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  savedSearchId: string;
}

export default async function (opts: Options) {
  const pg = await pgPool.connect();
  try {
    let q = `
    select
      id, name, project_id, environment_id, group_id, query_desc
    from
      saved_search
    where
      id = $1
    `;
    const result = await pg.query(q, [opts.savedSearchId]);
    if (result.rowCount === 1) {
      return result.rows[0];
    } else if (result.rowCount > 1) {
      throw new Error(`Expected row count of 1, got ${result.rowCount}`);
    }

    return null;

  } finally {
    pg.release();
  }
}
