import pg from "pg";
import getPgPool from "../persistence/pg";
import nsq, { NSQ, NSQClient } from "../persistence/nsq";
import { logger } from "../logger";
import config from "../../config";
import { incrementOtelCounter, recordOtelHistogram } from "../../metrics/opentelemetry/instrumentation";

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
  private readonly maxEvents: number;

  constructor(minAgeMs?: number, nsqClient?: NSQClient, pgPool?: pg.Pool, maxEvents?: number) {
    this.minAgeMs =
      minAgeMs || Number(config.PROCESSOR_NORMALIZE_REPAIRER_MIN_AGE_MS) || TWO_MINUTES_IN_MILLIS;
    this.nsq = nsqClient || nsq;
    this.pgPool = pgPool || getPgPool();

    this.maxEvents = maxEvents || Number(config.PROCESSOR_NORMALIZE_REPAIRER_MAX_EVENTS) || 10000;
  }

  public async repairOldEvents() {
    logger.warn(`Looking for jobs older than ${this.minAgeMs}ms missing 'normalized_event'`);
    const resp = await this.pgPool.query(NormalizeRepairer.selectFromIngestTask, [
      this.minAgeMs,
      this.maxEvents,
    ]);
    logger.warn(`Found ${resp.rows.length} jobs older than ${this.minAgeMs}ms missing 'normalized_event'`);

    if (!resp.rows.length) {
      logger.debug(`No jobs older than ${this.minAgeMs}ms missing 'normalized_event'`);
      incrementOtelCounter("NormalizeRepairer.repairOldEvents.allClear");

      return;
    }

    const oldestEvent = resp.rows[0];
    logger.warn(
      `Found ${resp.rows.length} event(s) older than ${this.minAgeMs}ms missing 'normalized_event'`
    );
    logger.warn(`Oldest event is ${oldestEvent.id} which was received ${oldestEvent.age_ms}ms ago`);
    // metrics
    incrementOtelCounter("NormalizeRepairer.repairOldEvents.hits", resp.rows.length);
    recordOtelHistogram("NormalizeRepairer.repairOldEvents.oldest", oldestEvent.age_ms);

    return Promise.all(
      resp.rows.map((row) => {
        recordOtelHistogram("NormalizeRepairer.repairOldEvents.age", row.age_ms);
        return this.nsq.produce("raw_events", JSON.stringify({ taskId: row.id }));
      })
    );
  }
}

export const defaultInstance = new NormalizeRepairer();
export const worker = defaultInstance.repairOldEvents.bind(defaultInstance);
