import * as uuid from "uuid";
import * as moment from "moment";

import ViewerDescriptor from "./def";
import getRedis from "../../persistence/redis";

const redis = getRedis(process.env.REDIS_URI);

export interface Options {
  projectId: string;
  environmentId: string;
  groupId: string;
  isAdmin: boolean;
  viewLogAction: string;
  actorId: string;
  targetId?: string;
}

export default async function createViewerDescriptor(opts: Options): Promise<ViewerDescriptor> {
  const newDesc: ViewerDescriptor = {
    id: uuid.v4().replace(/-/g, ""),
    projectId: opts.projectId,
    environmentId: opts.environmentId,
    groupId: opts.groupId,
    isAdmin: opts.isAdmin,
    viewLogAction: opts.viewLogAction,
    actorId: opts.actorId,
    created: moment().valueOf(),
    scope: "",
  };

  if (opts.targetId) {
    newDesc.scope = `target_id=${opts.targetId}`;
  }

  await redis.hmsetAsync(`viewer_descriptor:${newDesc.id}`, newDesc);

  await redis.expireAsync(`viewer_descriptor:${newDesc.id}`, 5 * 60);

  return newDesc;
}
