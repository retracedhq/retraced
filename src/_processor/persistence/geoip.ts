import { PoolClient } from "pg";

export default async function getLocationByIP(ipAddress, pg: PoolClient) {
  const q = "select * from geoip where network >> $1";
  const result = await pg.query(q, [ipAddress]);
  if (result.rowCount > 0) {
    return result.rows[0];
  }

  return null;
}
