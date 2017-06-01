import * as pg from "pg";
import getPgPool, { Querier } from "../../persistence/pg";
import { ApiToken } from "./index";

const pgPool: pg.Pool = getPgPool();

export const getApiTokenQuery = `
  select
    token, created, disabled, environment_id, name, project_id
  from
    token
  where
    token = $1
`;

export default async function getApiToken(
  token: string,
  querier?: Querier,
): Promise<ApiToken | null> {
  querier = querier || pgPool;

  const v = [token];
  const result = await querier.query(getApiTokenQuery, v);
  if (result.rowCount > 0) {
    return result.rows[0];
  }

  return null;
}
