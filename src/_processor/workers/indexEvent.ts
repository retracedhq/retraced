import "source-map-support/register";
import * as _ from "lodash";
import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export default async function indexEvent(job): Promise<void> {
    const jobObj = JSON.parse(job.body);
    const event = cleanEvent(jobObj.event);

    const q = `
        INSERT INTO indexed_events (
            id,
            project_id,
            environment_id,
            doc
        ) VALUES (
            $1,
            $2,
            $3,
            $4
        )`;

    await pgPool.query(q, [
        event.id,
        jobObj.projectId,
        jobObj.environmentId,
        JSON.stringify(event),
    ]);
}

function cleanEvent(event: any): any {
    if (event.group) {
        event.group = _.pick(event.group, ["id", "name"]);
    }
    if (event.actor) {
        event.actor = _.pick(event.actor, ["id", "foreign_id", "name", "url", "fields"]);

        if (event.actor.foreign_id) {
            event.actor.id = event.actor.foreign_id;
            _.unset(event.actor, "foreign_id");
        }
    }
    if (event.target) {
        event.target = _.pick(event.target, ["id", "foreign_id", "name", "url", "type", "fields"]);

        if (event.target.foreign_id) {
            event.target.id = event.target.foreign_id;
            _.unset(event.target, "foreign_id");
        }
    }
    return event;
}
