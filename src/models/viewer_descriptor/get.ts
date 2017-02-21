import ViewerDescriptor from "./def";

import * as redis from "redis";

export interface Options {
  id: string;
}

export default async function getViewerToken(opts: Options): Promise<ViewerDescriptor> {
  return new Promise<ViewerDescriptor>((resolve, reject) => {
    const redisClient = redis.createClient({ url: process.env.REDIS_URI });
    redisClient.hgetall(`viewer_descriptor:${opts.id}`, (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
