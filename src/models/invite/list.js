import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function listInvites(opts) {
  const fields = `id, email, project_id,
      extract(epoch from created) * 1000 as created`;

  const q = `select ${fields} from invite where project_id = $1`;
  const v = [opts.projectId];
  const result = await pgPool.query(q, v);
  if (result.rowCount > 0) {
    return result.rows;
  }

  return null;

}
