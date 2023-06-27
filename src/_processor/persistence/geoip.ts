import { PoolClient } from "pg";
import config from "../../config";

export default async function getLocationByIP(ipAddress, pg: PoolClient) {
  if (!ipAddress || config.RETRACED_DISABLE_GEOSYNC) {
    return undefined;
  }
  const q = "select * from geoip where network >> $1";
  const result = await pg.query(q, [ipAddress]);
  if (result.rowCount > 0) {
    return result.rows[0];
  }

  return undefined;
}
