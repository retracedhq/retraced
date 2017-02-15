import "source-map-support/register";
import * as uuid from "uuid";
import * as redis from "redis";
import * as util from "util";

/**
 * {
 *   project_id: {String}
 *   environment_id: {String}
 *   group_id: {String}
 *   format: {String}
 *   is_admin: {boolean}
 * }
 */
export default function createViewerToken(opts) {
  return new Promise((resolve, reject) => {
    const redisClient = redis.createClient({ url: process.env.REDIS_URI });
    const viewerToken = uuid.v4().replace(/-/g, "");

    const hash = {
      project_id: opts.project_id,
      environment_id: opts.environment_id,
      group_id: opts.group_id,
      created: new Date().getTime(),
      expires: new Date(new Date().getTime() + 5 * 60000).getTime(), // 5 minutes
      format: opts.format,
      is_admin: opts.is_admin,
    };
    redisClient.HMSET(`viewertoken:${viewerToken}`, hash, (err, res) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      redisClient.expire(`viewertoken:${viewerToken}`, 5 * 60, (expireErr, expireRes) => {
        if (expireErr) {
          console.log(expireErr);
          reject(expireErr);
          return;
        }

        redisClient.quit();
        resolve(viewerToken);
        return;
      });
    });
  });
}
