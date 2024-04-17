import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function remove(id: string) {
  const q = `DELETE FROM security_sink WHERE id = $1`;
  const v = [id];
  await pgPool.query(q, v);
  return true;
}
