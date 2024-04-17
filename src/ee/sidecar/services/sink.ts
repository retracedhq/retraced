import getPgPool from "../../../_db/persistence/pg";

export const setSinkAsActive = async (sinkId) => {
  const pg = getPgPool();
  await pg.query(`UPDATE security_sink SET active=true where id=$1`, [sinkId]);
};
