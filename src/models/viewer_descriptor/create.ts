import * as uuid from "uuid";
import * as redis from "redis";
import * as moment from "moment";

import ViewerDescriptor from "./def";

export interface Options {
  projectId: string;
  environmentId: string;
  groupId: string;
  isAdmin: boolean;
}

export default async function createViewerDescriptor(opts: Options): Promise<ViewerDescriptor> {
  const newDesc: ViewerDescriptor = {
    id: uuid.v4().replace(/-/g, ""),
    projectId: opts.projectId,
    environmentId: opts.environmentId,
    groupId: opts.groupId,
    isAdmin: opts.isAdmin,
    created: moment().valueOf(),
  };

  const redisClient = redis.createClient({ url: process.env.REDIS_URI });
  await new Promise((resolve, reject) => {
    redisClient.HMSET(`viewer_descriptor:${newDesc.id}`, newDesc, (err, res) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }
      redisClient.expire(`viewer_descriptor:${newDesc.id}`, 5 * 60, (expireErr, expireRes) => {
        if (expireErr) {
          console.log(expireErr);
          reject(expireErr);
          return;
        }
        resolve();
      });
    });
  });

  return newDesc;
}
