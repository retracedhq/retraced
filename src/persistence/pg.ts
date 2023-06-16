import pg from "pg";
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
      statement_timeout: Number(config.POSTGRES_STATEMENT_TIMEOUT) || 60000, // how long a query is allowed to run before being canceled
    });

    pgPool.on("error", () => {
      logger.error("postgres client connection error");
      incrementOtelCounter("PgPool.connection.error");
    });
  }

  return pgPool;
}

export interface Querier {
  query(query: string, args?: any[]): Promise<pg.QueryResult>;
}

const reportInterval = 30000;

function updatePoolGauges() {
  const pool = getPgPool();
  observeOtelGauge("PgPool.clients.waiting.count", pool.waitingCount);
  observeOtelGauge("PgPool.clients.total.count", pool.totalCount);
  observeOtelGauge("PgPool.clients.idle.count", pool.idleCount);
  observeOtelGauge("PgPool.clients.active.count", pool.totalCount - pool.idleCount);
}

setInterval(updatePoolGauges, reportInterval);
