import * as uuid from "uuid";
import * as moment from "moment";

import { User } from "./";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

const defaultTimezone = "US/Pacific";

export const ERR_DUPLICATE_EMAIL = new Error("DUPLICATE_EMAIL");

/**
 * createUser will create a new user account
 *
 * @param {Object} [opts] the request options
 * @param {string} [opts.email] the email address to use
 */
export default async function createUser(opts): Promise<User> {
  let pg;
  try {
    pg = await pgPool.connect();

    // Check for dupe e-mail
    let q = "select count(1) from retraceduser where email = $1";
    let v = [opts.email];
    const dupeCheckResult = await pg.query(q, v);
    if (dupeCheckResult.rows[0].count > 0) {
      throw ERR_DUPLICATE_EMAIL;
    }

    q = `insert into retraceduser (
      id, email, created, last_login, external_auth_id, timezone
    ) values (
      $1, $2, to_timestamp($3), to_timestamp($4), $5, $6
    )`;
    v = [
      uuid.v4().replace(/-/g, ""),
      opts.email,
      moment().unix(),
      moment().unix(),
      opts.authId,
      defaultTimezone,
    ];
    pg.query(q, v);

    return {
      id: v[0],
      email: v[1],
      timezone: v[5],
      external_auth_id: opts.authId,
      externalAuthId: opts.authId,
    };

  } finally {
    pg.release();
  }
}
