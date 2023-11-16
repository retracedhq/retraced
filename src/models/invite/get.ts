import getPgPool from "../../persistence/pg";
import { Invite, parseInvite } from "./index";

const pgPool = getPgPool();

export interface Options {
  inviteId?: string;
  email?: string;
}

export default async function getInvite(opts: Options): Promise<null | Invite> {
  const fields = `id, email, project_id,
      extract(epoch from created) * 1000 as created`;

  let q;
  let v;
  if (opts.inviteId) {
    q = `select ${fields} from invite where id = $1`;
    v = [opts.inviteId];
  } else if (opts.email) {
    q = `select ${fields} from invite where email = $1`;
    v = [opts.email];
  }

  const result = await pgPool.query(q, v);
  if (result.rowCount) {
    return parseInvite(result.rows[0] as any);
  }

  return null;
}
