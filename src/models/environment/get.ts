import { Environment, environmentFromRow } from "./";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function (envId: string): Promise<Environment | null> {
  const q = `
    select
      id, name, project_id
    from
      environment
    where
      id = $1
  `;
  const v = [envId];

  const response = await pgPool.query(q, v);

  if (response.rowCount === 0) {
    return null;
  }

  return environmentFromRow(response.rows[0]);
}
