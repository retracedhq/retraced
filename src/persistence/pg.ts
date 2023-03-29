import pg from "pg";
import { gauge, meter } from "../metrics";
import otel from "@opentelemetry/api";
import { logger } from "../logger";
import config from "../config";

let pgPool: pg.Pool;

const otelMeter = otel.metrics.getMeter("retraced-meter");

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
      otelMeter.createCounter("PgPool.connection.error").add(1);
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
  otelMeter
    .createObservableGauge("PgPool.clients.waiting.count")
    .addCallback((result) => result.observe(pool.waitingCount));
  gauge("PgPool.clients.waiting.count").set(pool.waitingCount);
  otelMeter
    .createObservableGauge("PgPool.clients.total.count")
    .addCallback((result) => result.observe(pool.totalCount));
  gauge("PgPool.clients.total.count").set(pool.totalCount);
  otelMeter
    .createObservableGauge("PgPool.clients.idle.count")
    .addCallback((result) => result.observe(pool.idleCount));
  gauge("PgPool.clients.idle.count").set(pool.idleCount);
  otelMeter
    .createObservableGauge("PgPool.clients.active.count")
    .addCallback((result) => result.observe(pool.totalCount - pool.idleCount));
  gauge("PgPool.clients.active.count").set(pool.totalCount - pool.idleCount);
}

setInterval(updatePoolGauges, reportInterval);
