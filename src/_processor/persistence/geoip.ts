import getPgPool from "../persistence/pg";
import config from "../../config";
import { logger } from "../logger";
import { queryMMDB } from "../../common/mmdb";

const pgPool = getPgPool();

export default function getLocationByIP(ipAddress): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      if (!ipAddress || config.RETRACED_DISABLE_GEOSYNC) {
        resolve(undefined);
        return;
      }
      if (config.USE_MMDB) {
        const response: any = queryMMDB(ipAddress);

        // console.log(response);
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

          resolve(ret);
        } else {
          resolve(undefined);
        }
      } else {
        pgPool.connect((err, pg, done) => {
          if (err) {
            reject(err);
            return;
          }

          const q = "select * from geoip where network >> $1";
          pg.query(q, [ipAddress], (qerr, result) => {
            done(true);
            if (qerr) {
              reject(qerr);
            } else if (result.rowCount > 0) {
              resolve(result.rows[0]);
            } else {
              resolve(undefined);
            }
          });
        });
      }
    } catch (err) {
      logger.error(err);
      resolve(undefined);
    }
  });
}
