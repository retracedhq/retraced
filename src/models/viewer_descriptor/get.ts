import ViewerDescriptor from "./def";
import getRedis from "../../persistence/redis";

export interface Options {
    id: string;
}

export default async function getViewerToken(opts: Options): Promise<ViewerDescriptor> {
    const redis = getRedis();
    return await redis.hgetallAsync(`viewer_descriptor:${opts.id}`);
}
