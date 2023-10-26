import pg from 'pg';
import config from '../config';

let pgPool: pg.Pool;

export default function getPgPool(): pg.Pool {
  if (!pgPool) {
    console.info('initializing pg pool');
    pgPool = new pg.Pool({
      user: config.POSTGRES_USER,
      database: config.POSTGRES_DATABASE,
      password: config.POSTGRES_PASSWORD,
      host: config.POSTGRES_HOST,
      port: Number(config.POSTGRES_PORT),
      max: Number(config.POSTGRES_POOL_SIZE) || 20,
      idleTimeoutMillis: Number(config.PUBLISHER_CREATE_EVENT_TIMEOUT) || 2000, // how long a client is allowed to remain idle before being closed
    });

    pgPool.on('error', () => {
      console.error('postgres client connection error');
    });
  }

  return pgPool;
}

export interface Querier {
  query(query: string, args?: any[]): Promise<pg.QueryResult>;
}
