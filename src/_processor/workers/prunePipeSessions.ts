import moment from "moment";

// import nsq from "../persistence/nsq";
import getRedis from "../persistence/redis";
import { logger } from "../logger";
import config from "../../config";

export default async function () {
  const redis = getRedis(config.WARP_PIPE_REDIS_DB);
  const allSessionIds = await redis.smembersAsync("all.session.ids");
  for (const sessionId of allSessionIds) {
    const sessionKey = `session:${sessionId}`;
    const session = await redis.hgetallAsync(sessionKey);
    // const eitapi = session["eitapi.token"];
    const lastSeen = moment(Number(session["last.seen"]));
    if (lastSeen.isBefore(moment().subtract("1", "hour"))) {
      // Ephemeral topics are deleted when the last client disconnects, but
      // created again on the next write to the topic.
      //await nsq.deleteTopic(eitapi + "#ephemeral");

      // Delete the redis structures
      const idsKey = `session.ids:${session["project.id"]}:${session["environment.id"]}:${session["group.id"]}`;
      await redis.sremAsync(idsKey, sessionId);
      await redis.sremAsync("all.session.ids", sessionId);
      await redis.delAsync(sessionKey);

      logger.info(`Pruned pipe session: ${sessionId}`);
    }
  }
}
