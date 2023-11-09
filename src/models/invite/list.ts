import moment from "moment";
import getPgPool from "../../persistence/pg";
import { Invite } from "./index";

const pgPool = getPgPool();

export interface Options {
  projectId: string;
}

export default async function listInvites(opts: Options): Promise<Invite[]> {
  const fields = `id, email, project_id,
      extract(epoch from created) * 1000 as created`;

  const q = `select ${fields} from invite where project_id = $1 order by created asc`;
  const v = [opts.projectId];
  const result = await pgPool.query(q, v);
  if (result.rowCount) {
    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      project_id: row.project_id,
      created: moment(+row.created),
    }));
  }

  return [];
}
