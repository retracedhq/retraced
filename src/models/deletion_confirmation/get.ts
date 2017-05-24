import getPgPool from "../../persistence/pg";
import {
  DeletionConfirmation,
  deletionConfirmationFromRow,
} from "./";

const pgPool = getPgPool();

export default async function (id: string): Promise<DeletionConfirmation | null> {
  const q = `
    select
      id, deletion_request_id, retraceduser_id, received, visible_code
    from
      deletion_confirmation
    where
      id = $1
  `;
  const v = [
    id,
  ];

  const response = await pgPool.query(q, v);

  if (response.rowCount === 0) {
    return null;
  }

  return deletionConfirmationFromRow(response.rows[0]);
}
