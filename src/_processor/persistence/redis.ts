import { createClient } from "redis";
import { logger } from "../logger";
import config from "../../config";

const sharedRedisClients = {};

export default function (db) {
  if (!sharedRedisClients[db]) {
    if (config.REDIS_URI) {
      sharedRedisClients[db] = createClient({
        url: config.REDIS_URI,
      });

      sharedRedisClients[db].on("error", (err) => {
        logger.error(err);
        sharedRedisClients[db] = null;
      });
    } else {
      // Fallback to mock redis
      sharedRedisClients[db] = {
        smembersAsync: () => Promise.resolve([]),
        hgetallAsync: () => Promise.resolve({}),
        sremAsync: () => Promise.resolve(0),
        delAsync: () => Promise.resolve(0),
      };
    }
  }

  return sharedRedisClients[db];
}
