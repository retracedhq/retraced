import * as chalk from "chalk";
import * as pg from "pg";

import { EventSource, Event, EventConsumer } from "./EventSource";

export default class PostgresEventSource implements EventSource {
    private readonly pageSize: number;
    private readonly pgPool: pg.Pool;

    constructor(pgPool: pg.Pool, pageSize?: number) {
        this.pgPool = pgPool;
        this.pageSize = pageSize || 5000;
    }

    public async iteratePaged(callback: EventConsumer): Promise<Event[]> {
        const pg = await this.pgPool.connect();

        let buffer: Event[] = [];
        return new Promise<Event[]>((resolve, reject) => {
            try {
                const q: any = pg.query("SELECT * FROM ingest_task");

                q.on("row", (task) => {
                    if (!task.normalized_event) {
                        console.log(chalk.yellow(`WARN Skipping task ${task.id}, it is missing 'normalized_event'`));
                        return;
                    }
                    buffer.push(this.buildEvent(task));
                });

                q.on("end", () => {
                    resolve(buffer);
                });

                q.on("err", (err) => {
                    reject(err);
                });
            } finally {
                pg.release();
            }
        });

    }

    private buildEvent(task: any): Event {
        const event = JSON.parse(task.normalized_event);

        const {
            id, description, action, crud, is_failure, is_anonymous,
            source_ip, country, loc_subdiv1, loc_subdiv2, raw,
            created, received, canonical_time,
            actor, group, target,
         } = event;

        const ret: Event = {
            id, description, action, crud, is_failure, is_anonymous,
            source_ip, country, loc_subdiv1, loc_subdiv2, raw,
            created: new Date(created),
            received: new Date(received),
            canonical_time: new Date(canonical_time),
        };

        if (group) {
            ret.team_id = group.id;
        }

        if (actor) {
            ret.actor_id = actor.id;
        }

        if (target) {
            ret.object_id = target.id;
        }

        return ret;
    }
}
