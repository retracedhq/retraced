import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  index: string;
  projectId: string;
  environmentId: string;
  sort: "asc" | "desc";
  sortColumn: "name" | "created";
  length: number;
  offset: number;
}

export interface Result {
  totalHits: number;
  count: number;
  templates?: any[];
}

export default async function (opts: Options): Promise<Result> {
  // This looks a lot like an ES query because i think we
  // should consider storing this in ES....  but it's out
  // of the scope of adding a groups page. but i just wanted to
  // go on the record saying i think this might be a problem with
  // larger customers!

  const pg = await pgPool.connect();
  try {
    const fields = `project_id, environment_id, id, name, rule, template,
        extract(epoch from created_at) * 1000 as created_at,
        extract(epoch from updated_at) * 1000 as updated_at`;

    // This variable gets written directly into the SQL statement. Do not pass
    // user opts directly into it. The value must be controlled to a known
    // and safe value.
    const direction = opts.sort === "asc" ? "asc" : "desc";
    const orderBy = opts.sortColumn === "name" ? "name" : "created";

    const q = `select ${fields} from display_template where environment_id = $1 order by ${orderBy} ${direction} limit $2 offset $3`;
    const v = [opts.environmentId, opts.length as any, opts.offset];
    const pgResult = await pg.query(q, v);

    const result: Result = {
      totalHits: pgResult.rowCount || 0,
      count: pgResult.rowCount || 0,
      templates: pgResult.rows,
    };

    return result;
  } finally {
    pg.release();
  }
}
