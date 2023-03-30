import pg from "pg";
import { gauge, meter } from "../metrics";
import { logger } from "../logger";
import config from "../config";
import { incrementOtelCounter, observeOtelGauge } from "../metrics/opentelemetry/instrumentation";

let pgPool: pg.Pool;

export default function getPgPool(): pg.Pool {
  if (!pgPool) {
    logger.info("initializing pg pool");
    pgPool = new pg.Pool({
      user: config.POSTGRES_USER,
      database: config.POSTGRES_DATABASE,
      password: config.POSTGRES_PASSWORD,
      host: config.POSTGRES_HOST,
      port: Number(config.POSTGRES_PORT),
      max: Number(config.POSTGRES_POOL_SIZE) || 20,
      idleTimeoutMillis: Number(config.PUBLISHER_CREATE_EVENT_TIMEOUT) || 2000, // how long a client is allowed to remain idle before being closed
    });

    pgPool.on("error", () => {
      logger.error("postgres client connection error");
      incrementOtelCounter("PgPool.connection.error");
      meter("PgPool.connection.error").mark();
    });
  }

  return pgPool;
}

export interface Querier {
  query(query: string, args?: any[]): Promise<pg.QueryResult>;
}

const reportInterval = config.STATSD_INTERVAL_MILLIS ? parseInt(config.STATSD_INTERVAL_MILLIS, 10) : 30000;

function updatePoolGauges() {
  // pg 7.0 + uses pg-pool 2.0 +, which has pool.waitingCount, etc.
  // but @types for 7.0 aren't out as of 7/27/2017
  const pool: any = getPgPool();
  observeOtelGauge("PgPool.clients.waiting.count", pool.waitingCount);
  gauge("PgPool.clients.waiting.count").set(pool.waitingCount);
  observeOtelGauge("PgPool.clients.total.count", pool.totalCount);
  gauge("PgPool.clients.total.count").set(pool.totalCount);
  observeOtelGauge("PgPool.clients.idle.count", pool.idleCount);
  gauge("PgPool.clients.idle.count").set(pool.idleCount);
  observeOtelGauge("PgPool.clients.active.count", pool.totalCount - pool.idleCount);
  gauge("PgPool.clients.active.count").set(pool.totalCount - pool.idleCount);
}

setInterval(updatePoolGauges, reportInterval);
