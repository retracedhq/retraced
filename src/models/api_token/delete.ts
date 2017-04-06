import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

// projectId, tokenId
export default async function deleteApiToken(opts) {
  const q = "delete from token where token = $1 and project_id = $2";
  const v = [opts.tokenId, opts.projectId];
  await pgPool.query(q, v);
}
