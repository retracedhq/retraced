import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  actionId: string;
  displayTemplate: string;
}

export default async function (opts: Options): Promise<any> {
  const pg = await pgPool.connect();
  try {
    const values = `id, environment_id, event_count, action, project_id, display_template,
        extract(epoch from created) * 1000 as created,
        extract(epoch from first_active) * 1000 as first_active,
        extract(epoch from last_active) * 1000 as last_active`;

    const q = `update action set display_template = $1 where id = $2 returning ${values}`;

    const v = [opts.displayTemplate, opts.actionId];

    const result = await pg.query(q, v);

    if (result.rowCount) {
      return result.rows[0];
    }

    return null;
  } finally {
    pg.release();
  }
}
