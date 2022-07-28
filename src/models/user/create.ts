import * as uuid from "uuid";
import moment from "moment";

import getPgPool, { Querier } from "../../persistence/pg";
import { RetracedUser } from "./index";

const pgPool = getPgPool();

const defaultTimezone = "US/Pacific";

export const ERR_DUPLICATE_EMAIL = new Error("DUPLICATE_EMAIL");

export interface Options {
  email: string;
  authId: string;
}

export default async function createUser(opts: Options): Promise<RetracedUser> {

  // Check for dupe e-mail
  let q = "select count(1) from retraceduser where email = $1";
  let v: (string | number)[] = [opts.email];
  const dupeCheckResult = await pgPool.query(q, v);
  if (dupeCheckResult.rows[0].count > 0) {
    throw ERR_DUPLICATE_EMAIL;
  }

  const now = moment();
  q = `insert into retraceduser (
      id, email, created, last_login, external_auth_id, timezone
    ) values (
      $1, $2, to_timestamp($3), to_timestamp($4), $5, $6
    )`;
  v = [
    uuid.v4().replace(/-/g, ""),
    opts.email,
    now.unix(),
    now.unix(),
    opts.authId,
    defaultTimezone,
  ];
  await pgPool.query(q, v);

  return {
    id: v[0] as string,
    email: v[1] as string,
    created: now,
    lastLogin: now,
    externalAuthId: v[4] as string,
    timezone: v[5] as string,
    txEmailsRecipient: true,
  };
}
