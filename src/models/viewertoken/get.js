import "source-map-support/register";
import * as redis from "redis";

/**
 * {
 *   viewer_token: {String}
 * }
 */
export default function getViewerToken(opts) {
  return new Promise((resolve, reject) => {
    const redisClient = redis.createClient({ url: process.env.REDIS_URI });

    redisClient.hgetall(`viewertoken:${opts.viewer_token}`, (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      redisClient.quit();
      resolve(result);
    });
  });
}
