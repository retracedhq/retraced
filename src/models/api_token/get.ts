import * as pg from "pg";
import getPgPool, { Querier } from "../../persistence/pg";
import { PublisherToken } from "./index";

const pgPool: pg.Pool = getPgPool();

/**
 * Asynchronously fetch a token from the database.
 *
 * @param {string} [token] The token
 */
export default async function getApiToken(
    token: string,
    querier?: Querier,
): Promise<PublisherToken | null> {
    querier = querier || pgPool;
    const q = "select * from token where token = $1";
    const v = [token];
    const result = await querier.query(q, v);
    if (result.rowCount > 0) {
        return result.rows[0];
    }

    return null;
}
