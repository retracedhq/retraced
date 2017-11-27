import "source-map-support/register";
import * as redis from "redis";
import * as bluebird from "bluebird";
import { logger } from "../logger";

bluebird.promisifyAll(redis.RedisClient.prototype);

let sharedRedisClient;

export default function() {
  if (!sharedRedisClient) {
      sharedRedisClient = redis.createClient({
          url: process.env.REDIS_URI,
          socket_keepalive: true,
          retry_strategy: (options) => {
              const max = 10000;
              return Math.min(options.attempt * 1000, max);
          },
      });

      sharedRedisClient.on("error", (err) => {
          logger.error(err);
          sharedRedisClient = null;
      });
  }

  return sharedRedisClient;
}
