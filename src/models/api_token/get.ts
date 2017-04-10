import * as pg from "pg";
import getPgPool from "../../persistence/pg";

const pgPool: pg.Pool = getPgPool();

/**
 * Asynchronously fetch a token from the database.
 *
 * @param {string} [token] The token
 */
export default async function getApiToken(token: string, pool?: pg.Pool): Promise<string|null> {
    pool = pool || pgPool;
    const q = "select * from token where token = $1";
    const v = [token];
    const result = await pool.query(q, v);
    if (result.rowCount > 0) {
        return result.rows[0];
    }

    return null;
}
