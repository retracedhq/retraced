import * as pg from "pg";
import { gauge } from "../metrics";

let pgPool: pg.Pool;

export default function getPgPool(): pg.Pool {
  if (!pgPool) {
    pgPool = new pg.Pool({
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DATABASE,
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      max: process.env.POSTGRES_POOL_SIZE || 10,
      idleTimeoutMillis: Number(process.env.PUBLISHER_CREATE_EVENT_TIMEOUT) || 2000, // how long a client is allowed to remain idle before being closed
    });
  }

  return pgPool;
}

export interface Querier {
  query(query: string, args?: any[]): Promise<pg.QueryResult>;
}

const reportInterval = process.env.STATSD_INTERVAL_MILLIS || 30000;

function updatePoolGauges() {
  // pg 7.0 + uses pg-pool 2.0 +, which has pool.waitingCount, etc.
  // but @types for 7.0 aren't out as of 7/27/2017
  const pool: any = getPgPool();

  gauge("PgPool.clients.waiting.count").set(pool.waitingCount);
  gauge("PgPool.clients.total.count").set(pool.totalCount);
  gauge("PgPool.clients.idle.count").set(pool.idleCount);
  gauge("PgPool.clients.active.count").set(pool.totalCount - pool.idleCount);
}

setInterval(updatePoolGauges, reportInterval);
