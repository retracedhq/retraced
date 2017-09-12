import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
    project_id: string;
    environment_id: string;
    group_id: string;
    limit?: number;
}

export default async function listSavedExports(opts: Options) {
    let q = `
        select * from saved_export
        where project_id = $1
            and environment_id = $2
            and group_id = $3
        order by saved_at desc`;
    const v = [
        opts.project_id,
        opts.environment_id,
        opts.group_id,
    ];

    if (opts.limit) {
        q = `${q} limit ${opts.limit}`;
    }

    const result = await pgPool.query(q, v);

    return result.rows;
}
