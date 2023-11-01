import nsq from "../../persistence/nsq";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function remove(id) {
  const q = `DELETE FROM vectorsink WHERE id = $1`;
  const v = [id];
  nsq.produce("sink_deleted", JSON.stringify({ id }));
  await pgPool.query(q, v);
  return true;
}
