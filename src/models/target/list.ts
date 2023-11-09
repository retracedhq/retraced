import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  projectId: string;
  environmentId: string;
}

export default async function (opts: Options) {
  const pg = await pgPool.connect();
  try {
    const fields = `id, environment_id, event_count, foreign_id, name, project_id, url, type,
        extract(epoch from created) * 1000 as created,
        extract(epoch from first_active) * 1000 as first_active,
        extract(epoch from last_active) * 1000 as last_active`;

    const q = `select ${fields} from target where
      project_id = $1 and
      environment_id = $2`;
    const v = [opts.projectId, opts.environmentId];

    const result = await pg.query(q, v);

    if (result.rowCount) {
      const targets: any = [];
      for (const row of result.rows) {
        targets.push(
          Object.assign({}, row, {
            retraced_object_type: "target",
          })
        );
      }
      return targets;
    }

    return [];
  } finally {
    pg.release();
  }
}
