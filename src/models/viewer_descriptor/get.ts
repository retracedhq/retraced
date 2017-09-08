import ViewerDescriptor from "./def";
import getRedis from "../../persistence/redis";

const redis = getRedis(process.env.REDIS_URI);

export interface Options {
    id: string;
}

export default async function getViewerToken(opts: Options): Promise<ViewerDescriptor> {
    return await redis.hgetallAsync(`viewer_descriptor:${opts.id}`);
}
