import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
    projectId: string;
    environmentId: string;
    groupId: string;
    actorId: string;
}

export default async function modelDeleteViewerDescriptors(opts: Options): Promise<void> {
    const q = `
        DELETE FROM viewer_descriptors
        WHERE project_id = $1 AND
            environment_id = $2 AND
            group_id = $3 AND
            actor_id = $4`;
    const values = [
        opts.projectId,
        opts.environmentId,
        opts.groupId,
        opts.actorId,
    ];

    await pgPool.query(q, values);
}
