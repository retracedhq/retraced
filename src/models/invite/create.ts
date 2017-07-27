import * as uuid from "uuid";
import * as moment from "moment";

import getPgPool from "../../persistence/pg";
import { Invite } from "./";

const pgPool = getPgPool();

export interface Options {
  email: string;
  project_id: string;
  id?: string;
}

/**
 * Invite a new member to a project.
 */
export default async function createInvite(opts: Options): Promise<Invite> {
  const invite = {
    id: opts.id || uuid.v4().replace(/-/g, ""),
    project_id: opts.project_id,
    created: moment(),
    email: opts.email,
  };

  const q = `insert into invite (
    id, project_id, created, email
  ) values (
    $1, $2, to_timestamp($3::double precision / 1000), $4
  )`;
  const v = [
    invite.id,
    invite.project_id,
    invite.created.valueOf(),
    invite.email,
  ];
  await pgPool.query(q, v);

  return invite;
}
