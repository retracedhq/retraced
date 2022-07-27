import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  actorIds: string[];
}

export default async function(opts: Options): Promise<any> {
  if (!opts.actorIds || opts.actorIds.length === 0) {
    return [];
  }

  const pg = await pgPool.connect();
  try {
    const fields = `
        id, environment_id, event_count, foreign_id, name, project_id, url,
        extract(epoch from created) * 1000 as created,
        extract(epoch from first_active) * 1000 as first_active,
        extract(epoch from last_active) * 1000 as last_active`;

    const tokenList = opts.actorIds.map((a, i) => `$${i + 1}`);
    const q = `select ${fields} from actor where id in (${tokenList})`;
    const v = opts.actorIds;

    const result = await pg.query(q, v);

    if (result.rowCount > 0) {
      const actors: any = [];
      for (const row of result.rows) {
        actors.push(Object.assign({}, row, {
          retraced_object_type: "actor",
        }));
      }
      return actors;
    }

    return [];

  } finally {
    pg.release();
  }
}
