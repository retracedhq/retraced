import moment from "moment";
import ViewerDescriptor from "./def";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
    id: string;
}

export default async function getViewerToken(opts: Options): Promise<ViewerDescriptor|null> {
    const q = `
        SELECT
            id,
            project_id,
            environment_id,
            group_id,
            is_admin,
            view_log_action,
            actor_id,
            created,
            scope
        FROM viewer_descriptors
        WHERE id = $1
        AND created > $2`;
    const values = [
        opts.id,
        moment().subtract(5, "minutes").format(),
    ];
    const results = await pgPool.query(q, values);

    if (!results.rowCount) {
        return null;
    }

    const record = results.rows[0];
    return {
        id: record.id,
        projectId: record.project_id,
        environmentId: record.environment_id,
        groupId: record.group_id,
        isAdmin: record.isAdmin,
        viewLogAction: record.view_log_action,
        actorId: record.actor_id,
        created: moment(record.created).valueOf(),
        scope: record.scope,
    };
}
