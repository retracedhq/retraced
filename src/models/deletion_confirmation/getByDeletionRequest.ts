import getPgPool from "../../persistence/pg";
import { DeletionConfirmation, deletionConfirmationFromRow } from "./";

const pgPool = getPgPool();

export default async function (deletionRequestId: string): Promise<DeletionConfirmation[]> {
  const q = `
    select
      id, deletion_request_id, retraceduser_id, received, visible_code
    from
      deletion_confirmation
    where
      deletion_request_id = $1
  `;
  const v = [deletionRequestId];

  const response = await pgPool.query(q, v);

  if (response.rowCount === 0) {
    return [];
  }

  const deletionConfirmations: DeletionConfirmation[] = [];
  for (const row of response.rows) {
    deletionConfirmations.push(deletionConfirmationFromRow(row));
  }

  return deletionConfirmations;
}
