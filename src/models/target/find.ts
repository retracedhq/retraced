import * as _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  foreignTargetIds: string[];
  environmentId: string;
}

export default async function (opts: Options): Promise<any> {
  const pg = await pgPool.connect();
  try {
    const fields = `id, environment_id, event_count, foreign_id, name, project_id, url, type,
        extract(epoch from created) * 1000 as created,
        extract(epoch from first_active) * 1000 as first_active,
        extract(epoch from last_active) * 1000 as last_active`;

    const tokenList = opts.foreignTargetIds.map((a, i) => { return `$${i + 2}`; });
    const q = `select ${fields} from target where environment_id = $1 and foreign_id in (${tokenList})`;
    const v = _.flatten([opts.environmentId, opts.foreignTargetIds]);

    const result = await pg.query(q, v);

    if (result.rowCount > 0) {
      const targets: any = [];
      for (const row of result.rows) {
        targets.push(Object.assign({}, row, {
          retraced_object_type: "target",
        }));
      }
      return targets;
    }

    return [];

  } finally {
    pg.release();
  }
}
