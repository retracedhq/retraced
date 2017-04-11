import * as pg from "pg";
import getPgPool from "../../persistence/pg";

const pgPool: pg.Pool = getPgPool();

/**
 * Asynchronously fetch a token from the database.
 *
 * @param {string} [token] The token
 */
export default async function getApiToken(
    token: string,
    query?: (q: string, v: any[]) => Promise<pg.QueryResult>,
): Promise<string | null> {
    query = query || pgPool.query.bind(pgPool);
    const q = "select * from token where token = $1";
    const v = [token];
    const result = await query!(q, v); // shouldn't need ! here but tsc is being weird
    if (result.rowCount > 0) {
        return result.rows[0];
    }

    return null;
}
