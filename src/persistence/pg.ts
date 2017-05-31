import * as pg from "pg";

let pgPool: pg.Pool;

export default function getPgPool(): pg.Pool {
  if (!pgPool) {
    pgPool = new pg.Pool({
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DATABASE,
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      max: 10, // max number of clients in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    });
  }

  return pgPool;
}

export interface Querier {
  query(query: string, args?: any[]): Promise<pg.QueryResult>;
}
