import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

export const getAll = async () => {
  const q = `SELECT * FROM vectorsink`;
  const result = await pgPool.query(q, []);
  return result.rows;
};

export const getById = async (id: string) => {
  const q = `SELECT * FROM vectorsink WHERE id = $1`;
  const result = await pgPool.query(q, [id]);
  return result.rows[0];
};
