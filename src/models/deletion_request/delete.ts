import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export default async function (id: string) {
  const q = `
    delete
    from
      deletion_request
    where
      id = $1
  `;
  const v = [
    id,
  ];

  const response = await pgPool.query(q, v);

  if (response.rowCount === 0) {
    console.log(`Expected deletion_request row to be deleted, but rowCount == 0`);
  }
}
