import * as _ from "lodash";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  index: string;
  projectId: string;
  environmentId: string;
  sort: "asc" | "desc";
  sortColumn: "name" | "created" | "last_seen";
}

export interface Result {
  totalHits: number;
  count: number;
  groups?: any[];
}

export default async function(opts: Options): Promise<Result> {
  // This looks a lot like an ES query because i think we
  // should consider storing this in ES....  but it's out
  // of the scope of adding a groups page. but i just wanted to
  // go on the record saying i think this might be a problem with
  // larger customers!

  const pg = await pgPool.connect();
  try {
    const fields = `project_id, environment_id, group_id, name, event_count,
        extract(epoch from created_at) * 1000 as created_at,
        extract(epoch from last_active) * 1000 as last_active`;

    // This variable gets written directly into the SQL statement. Do not pass
    // user opts directly into it. The value must be controlled to a known
    // and safe value.
    const direction = opts.sort === "asc" ? "asc" : "desc";

    const q = `select ${fields} from group_detail where environment_id = $1 order by $2 ${direction}`;
    const v = [
      opts.environmentId,
      opts.sortColumn,
    ];
    const pgResult = await pg.query(q, v);

    const result: Result = {
      totalHits: pgResult.rowCount,
      count: pgResult.rowCount,
      groups: pgResult.rows,
    };

    return result;

  } finally {
    pg.release();
  }
}
