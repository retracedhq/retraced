import moment from "moment";
import _ from "lodash";

import getRedis from "../persistence/redis";
import config from "../../config";
import { recordOtelHistogram } from "../../metrics/opentelemetry/instrumentation";

export default async function (job) {
  const redis = getRedis(config.WARP_PIPE_REDIS_DB);
  const jobObj = JSON.parse(job.body);
  const groupId = jobObj.event.group && jobObj.event.group.id;
  const { projectId, environmentId, event: normalizedEvent } = jobObj;

  if (!groupId) {
    return;
  }

  const idsKey = `session.ids:${projectId}:${environmentId}:${groupId}`;
  const activeSessions = await redis.smembersAsync(idsKey);
  const eitapis: string[] = [];

  for (const sessionId of activeSessions) {
    const key = `session:${sessionId}`;
    const session = await redis.hgetallAsync(key);

    if (!_.includes(eitapis, session["eitapi.token"])) {
      eitapis.push(session["eitapi.token"]);
    }
  }
  if (!eitapis.length) {
    return;
  }

  for (const eitapi of eitapis) {
    const topic = eitapi + "#ephemeral";
    // await nsq.produce(topic, JSON.stringify(normalizedEvent));
  }

  const now = moment.utc().valueOf();

  if (normalizedEvent.created) {
    recordOtelHistogram("workers.streamEvent.latencyCreated", now - normalizedEvent.created);
  }

  recordOtelHistogram("workers.streamEvent.latencyReceived", now - normalizedEvent.received);
}
