import chalk from "chalk";
import pg from "pg";
import Cursor from "pg-cursor";

import { Event, EventConsumer, EventSource } from "./EventSource";
import { logger } from "../../logger";

export default class PostgresEventSource implements EventSource {
    private readonly pageSize: number;

    constructor(
      private readonly pgPool: pg.Pool,
      private readonly startDate?: string,
      private readonly endDate?: string,
      pageSize?: number,
    ) {
        this.pageSize = pageSize || 5000;

    }

    public async iteratePaged(callback: EventConsumer): Promise<void> {
        logger.info({msg: "connecting"});
        const pgPool = await this.pgPool.connect();

        try {
            logger.info({msg: "building stream query"});
            const query: Cursor = this.getQuery();
            logger.info({msg: "executing query"});
            const q: any = pgPool.query(query);

            while (true) {
              const rows = await new Promise<any[]>((resolve, reject) => {
                q.read(this.pageSize, (err, result) => {
                  if (err)  {
                    reject(err);
                    return;
                  }
                  resolve(result);
                });
              });
              if (rows.length === 0) {
                return;
              }

              const events = rows.filter((r) => {
                if (!r.normalized_event) {
                  console.log(chalk.yellow(`WARN Skipping task ${r.id}, it is missing 'normalized_event'`));
                  return false;
                }
                return true;
              }).map((r) => this.buildEvent(r));

              await callback(events);
            }
        } finally {
            pgPool.release();
        }

    }

  private getQuery(): Cursor {
    if (this.startDate && this.endDate) {
       return new Cursor("SELECT * FROM ingest_task WHERE $1::tsrange @> received", [`[${this.startDate}, ${this.endDate})`]);
    } else if (this.startDate && (!this.endDate)) {
      return new Cursor("SELECT * FROM ingest_task WHERE received >= $1 ", [this.startDate]);
    } else if ((!this.startDate) && this.endDate) {
      return new Cursor("SELECT * FROM ingest_task WHERE received < $1 ", [this.endDate]);
    } else {
      return new Cursor("SELECT * FROM ingest_task ");

    }
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
