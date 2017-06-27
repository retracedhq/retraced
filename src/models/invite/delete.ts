import "source-map-support/register";
import getPgPool, { Querier } from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
    inviteId: string;
    projectId: string;
}

export default async function deleteInvite(opts: Options, pg: Querier = pgPool) {
    const q = "delete from invite where id = $1 and project_id = $2";
    const v = [opts.inviteId, opts.projectId];

    await pg.query(q, v);
}
