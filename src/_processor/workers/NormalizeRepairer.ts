import pg from "pg";
import * as monkit from "monkit";

import getPgPool from "../persistence/pg";
import nsq, { NSQ, NSQClient } from "../persistence/nsq";
import { logger } from "../logger";
import config from "../../config";

/**
 * This worker runs at a scheduled interval.
 *
 * It will find all messages older than `minAgeMs` that don't have a
 * `normalized_event` object in postgres, and put another job onto
 * the `raw_events` nsq topic.
 *
 * If everything is working properly, this should never have to do any work,
 * but this will handle cleanup in case processing fails or in case the
 * API is unable to communicate with nsq.
 *
 */
const TWO_MINUTES_IN_MILLIS = 120000;

export default class NormalizeRepairer {

    public static readonly selectFromIngestTask = `
    SELECT
           id,
           extract(epoch from received) * 1000 as received_ms,
           (extract(epoch from CURRENT_TIMESTAMP) - extract(epoch from received)) * 1000 as age_ms
    FROM ingest_task
    WHERE normalized_event IS NULL
      AND (extract(epoch from CURRENT_TIMESTAMP) - extract(epoch from received)) * 1000 > $1
    ORDER BY age_ms DESC
    LIMIT $2
    `;

    private readonly minAgeMs: number;
    private readonly nsq: NSQ;
    private readonly pgPool: pg.Pool;
    private metricRegistry: monkit.Registry;
    private readonly maxEvents: number;

    constructor(minAgeMs?: number, nsqClient?: NSQClient, pgPool?: pg.Pool, registry?: monkit.Registry, maxEvents?: number) {
        this.minAgeMs = minAgeMs || Number(config.PROCESSOR_NORMALIZE_REPAIRER_MIN_AGE_MS) || TWO_MINUTES_IN_MILLIS;
        this.nsq = nsqClient || nsq;
        this.pgPool = pgPool || getPgPool();

        this.maxEvents = maxEvents || Number(config.PROCESSOR_NORMALIZE_REPAIRER_MAX_EVENTS) || 10000;

        this.metricRegistry = registry || monkit.getRegistry();
        this.metricRegistry.meter("NormalizeRepairer.repairOldEvents.hits");
        this.metricRegistry.histogram("NormalizeRepairer.repairOldEvents.oldest");
        this.metricRegistry.histogram("NormalizeRepairer.repairOldEvents.age");
    }

    public async repairOldEvents() {

        const resp = await this.pgPool.query(NormalizeRepairer.selectFromIngestTask, [this.minAgeMs, this.maxEvents]);
        if (!resp.rows.length) {
            logger.debug(`No jobs older than ${this.minAgeMs}ms missing 'normalized_event'`);
            this.metricRegistry.meter("NormalizeRepairer.repairOldEvents.allClear").mark();
            return;
        }

        const oldestEvent = resp.rows[0];
        logger.warn(`Found ${resp.rows.length} event(s) older than ${this.minAgeMs}ms missing 'normalized_event'`);
        logger.warn(`Oldest event is ${oldestEvent.id} which was received ${oldestEvent.age_ms}ms ago`);
        this.metricRegistry?.meter("NormalizeRepairer.repairOldEvents.hits").mark(resp.rows.length);
        this.metricRegistry?.histogram("NormalizeRepairer.repairOldEvents.oldest").update(oldestEvent.age_ms);

        return Promise.all(resp.rows.map((row) => {
            this.metricRegistry?.histogram("NormalizeRepairer.repairOldEvents.age").update(row.age_ms);
            return this.nsq.produce("raw_events", JSON.stringify({ taskId: row.id }));
        }));
    }
}

export const defaultInstance = new NormalizeRepairer();
export const worker = defaultInstance.repairOldEvents.bind(defaultInstance);
