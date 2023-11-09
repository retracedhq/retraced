import { ApiToken, apiTokenFromRow } from "./";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export interface Options {
  projectId: string;
}

export default async function listApiTokens(opts: Options): Promise<ApiToken[]> {
  const q = `
        select
            token,
            project_id,
            created,
            disabled,
            environment_id,
            name
        from
            token
        where
            project_id = $1`;
  const v = [opts.projectId];
  const result = await pgPool.query(q, v);
  const rows = result.rowCount ? result.rows : [];

  return rows.map(apiTokenFromRow);
}
