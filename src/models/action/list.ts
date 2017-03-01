import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  projectId: string;
  environmentId: string;
}

export default async function (opts: Options): Promise<any> {
  const pg = await pgPool.connect();
  try {
    const values = `id, environment_id, event_count, action, project_id, display_template,
        extract(epoch from created) * 1000 as created,
        extract(epoch from first_active) * 1000 as first_active,
        extract(epoch from last_active) * 1000 as last_active`;

    const q = `select ${values} from action where
      project_id = $1 and
      environment_id = $2 order by action`;
    const v = [
      opts.projectId,
      opts.environmentId,
    ];

    const result = await pg.query(q, v);
    if (result.rowCount > 0) {
      return result.rows;
    }

    return [];

  } finally {
    pg.release();
  }
}
