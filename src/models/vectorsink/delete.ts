import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default function remove(id) {
  const q = `DELETE FROM vectorsink WHERE id = $1`;
  const v = [id];
  return pgPool.query(q, v);
}
