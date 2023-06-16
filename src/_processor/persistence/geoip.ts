import getPgPool from "../persistence/pg";
import config from "../../config";

const pgPool = getPgPool();

export default function getLocationByIP(ipAddress) {
  return new Promise((resolve, reject) => {
    if (!ipAddress || config.RETRACED_DISABLE_GEOSYNC) {
      resolve(undefined);
      return;
    }

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
  });
}
