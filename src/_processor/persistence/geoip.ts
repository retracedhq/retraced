import { PoolClient } from "pg";
import config from "../../config";
import { logger } from "../logger";
import { queryMMDB } from "../../common/mmdb";

export default async function getLocationByIP(ipAddress, pg: PoolClient) {
  try {
    if (!ipAddress || config.RETRACED_DISABLE_GEOSYNC) {
      return undefined;
    }
    if (config.MAXMIND_GEOLITE2_USE_MMDB) {
      const response: any = queryMMDB(ipAddress);
      if (response) {
        const ret = {
          lat: response.location?.latitude,
          lon: response.location?.longitude,
          country: response.country?.names.en,
          city: response.city?.names.en,
          subdiv1: response?.subdivisions
            ? response?.subdivisions.length >= 1
              ? response?.subdivisions[0]?.names?.en
              : "unknown"
            : "unknown",
          subdiv2: response?.subdivisions
            ? response?.subdivisions.length >= 2
              ? response?.subdivisions[1]?.names?.en
              : "unknown"
            : "unknown",
          timezone: response.location?.timeZone,
        };

        return ret;
      } else {
        return undefined;
      }
    } else {
      const q = "select * from geoip where network >> $1";
      const result = await pg.query(q, [ipAddress]);
      if (result.rowCount > 0) {
        return result.rows[0];
      }
    }
  } catch (err) {
    logger.info(`Error resolving IP to geo: ${err}`);
    return undefined;
  }
}
