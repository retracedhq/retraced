import * as pg from "pg";
import { histogram } from "monkit";

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
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    });
  }

  return pgPool;
}

export interface Querier {
  query(query: string, args?: any[]): Promise<pg.QueryResult>;
}

function updatePoolGauges() {
  // pg 7.0 + uses pg-pool 2.0 +, which has pool.waitingCount, etc.
  // but @types for 7.0 aren't out as of 7/27/2017
  const pool: any = getPgPool();

  histogram("pgPool.waitingCount").update(pool.waitingCount);
  histogram("pgPool.totalCount").update(pool.totalCount);
  histogram("pgPool.idleCount").update(pool.idleCount);
  histogram("pgPool.activeCount").update(pool.totalCount - pool.idleCount);
}

setInterval(updatePoolGauges, 1000);
