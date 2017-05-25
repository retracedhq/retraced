import getPgPool from "../../persistence/pg";
import {
  RetracedUser,
  retracedUserFromRow,
} from "./";

const pgPool = getPgPool();

export default async function (id: string): Promise<RetracedUser | null> {
  const q = `
    select
      id, created, email, last_login, external_auth_id, timezone, tx_emails_recipient
    from
      retraceduser
    where
      id = $1
  `;
  const v = [
    id,
  ];

  const results = await pgPool.query(q, v);
  if (results.rowCount === 0) {
    return null;
  }

  return retracedUserFromRow(results.rows[0]);
}
