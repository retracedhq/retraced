import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  actorId: string;
}

export default async function (opts: Options): Promise<any> {
  const pg = await pgPool.connect();
  try {
    const fields = `
        id, environment_id, event_count, foreign_id, name, project_id, url,
        extract(epoch from created) * 1000 as created,
        extract(epoch from first_active) * 1000 as first_active,
        extract(epoch from last_active) * 1000 as last_active`;

    const q = `select ${fields} from actor where id = $1`;
    const v = [opts.actorId];

    const result = await pg.query(q, v);

    if (result.rowCount > 0) {
      return Object.assign({}, result.rows[0], {
        retraced_object_type: "actor",
      });
    }

    return null;

  } finally {
    pg.release();
  }
}
