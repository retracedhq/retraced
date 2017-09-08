import "source-map-support/register";
import * as redis from "redis";
import * as bluebird from "bluebird";

bluebird.promisifyAll(redis.RedisClient.prototype);

let sharedRedisClient;

export default function(db) {
  if (!sharedRedisClient) {
      sharedRedisClient = redis.createClient({
          url: process.env.REDIS_URI,
      });
  }

  return sharedRedisClient;
}
