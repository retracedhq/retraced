import "source-map-support/register";
import * as redis from "redis";
import * as bluebird from "bluebird";
import { logger } from "../logger";

bluebird.promisifyAll(redis.RedisClient.prototype);

const sharedRedisClients = {};

export default function(db) {
  if (!sharedRedisClients[db]) {
      sharedRedisClients[db] = redis.createClient({
          url: process.env.REDIS_URI,
          socket_keepalive: true,
          retry_strategy: (options) => {
              const max = 10000;
              return Math.min(options.attempt * 1000, max);
          },
      });

      sharedRedisClients[db].on("error", (err) => {
          logger.error(err);
          sharedRedisClients[db] = null;
      });
  }

  return sharedRedisClients[db];
}
