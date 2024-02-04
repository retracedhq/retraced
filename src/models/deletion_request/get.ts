import getPgPool from "../../persistence/pg";
import { DeletionRequest, deletionRequestFromRow } from "./";

const pgPool = getPgPool();

export default async function (id: string): Promise<DeletionRequest | null> {
  const q = `
    select
      id, created, backoff_interval, resource_kind, resource_id
    from
      deletion_request
    where
      id = $1
  `;
  const v = [id];

  const response = await pgPool.query(q, v);

  if (response.rowCount === 0) {
    return null;
  }

  return deletionRequestFromRow(response.rows[0]);
}
