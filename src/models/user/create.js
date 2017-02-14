import * as uuid from "uuid";
import * as util from "util";
import * as moment from "moment";

import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export const DUPLICATE_EMAIL = new Error("DUPLICATE_EMAIL");

/**
 * createUser will create a new user account
 *
 * @param {Object} [opts] the request options
 * @param {string} [opts.email] the email address to use
 */
export default async function createUser(opts) {
  let pg;
  try {
    pg = await pgPool.connect();

    // Check for dupe e-mail
    let q = "select count(1) from retraceduser where email = $1";
    let v = [opts.email];
    const dupeCheckResult = await pg.query(q, v);
    if (dupeCheckResult.rows[0].count > 0) {
      throw DUPLICATE_EMAIL;
    }

    q = `insert into retraceduser (
      id, email, created, last_login, external_auth_id
    ) values (
      $1, $2, to_timestamp($3), to_timestamp($4), $5
    )`;
    v = [
      uuid.v4().replace(/-/g, ""),
      opts.email,
      moment().unix(),
      moment().unix(),
      opts.authId,
    ];
    pg.query(q, v);

    return {
      id: v[0],
      email: v[1],
    };

  } finally {
    pg.release();
  }
}
