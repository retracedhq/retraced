import "source-map-support/register";

import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export default function getLocationByIP(ipAddress) {
  return new Promise((resolve, reject) => {
    if (!ipAddress) {
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
