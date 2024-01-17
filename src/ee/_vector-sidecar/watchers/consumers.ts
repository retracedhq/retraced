import nsq from "../../../_processor/persistence/nsq";
import { handleSinkCreated, handleSinkDeleted, handleSinkUpdated } from "../services/vector";
import getPgPool from "../../../persistence/pg";
import { ConfigManager } from "../services/configManager";
import uniqueId from "../../../models/uniqueId";
import { searchByReceived, encodeCursor, decodeCursor } from "../../../handlers/graphql/search";
import { call, ExponentialStrategy } from "backoff";
import { logger } from "../../../logger";
import { Sink, getSinkInstance } from "../../sinks";

const pg = getPgPool();
const batchSize = 1000;
const eventsPerBatch = 100;
const sendEventsRunningStatus: { [sinkId: string]: boolean } = {};

export function addConsumers() {
  nsq.consume(
    "sink_created",
    "vector_sidecar",
    async (msg) => {
      try {
        const sink = JSON.parse(msg.body);
        await handleSinkCreated(sink);
        msg.finish();
      } catch (ex) {
        logger.error(ex);
      }
    },
    {
      maxAttempts: 1,
      maxInFlight: 5,
      messageTimeoutMS: 10000,
    }
  );

  nsq.consume(
    "sink_deleted",
    "vector_sidecar",
    (msg) => {
      try {
        const sink = JSON.parse(msg.body);
        handleSinkDeleted(sink);
        msg.finish();
      } catch (ex) {
        logger.error(ex);
      }
    },
    {
      maxAttempts: 1,
      maxInFlight: 5,
      messageTimeoutMS: 10000,
    }
  );

  nsq.consume(
    "sink_updated",
    "vector_sidecar",
    async (msg) => {
      try {
        const sink = JSON.parse(msg.body);
        await handleSinkUpdated(sink);
        msg.finish();
      } catch (ex) {
        logger.error(ex);
      }
    },
    {
      maxAttempts: 1,
      maxInFlight: 5,
      messageTimeoutMS: 10000,
    }
  );

  nsq.consume(
    "pull_events_for_export",
    "vector_sidecar",
    async (msg) => {
      try {
        const windowEnd = +new Date() - 5 * 60 * 1000;
        const keys = Object.keys(ConfigManager.getInstance().configs);
        const configManagerInstance = ConfigManager.getInstance();
        if (keys.length === 0) {
          msg.finish();
          return;
        }
        const sinks = await getSinksByIds(keys);
        if (sinks.rowCount === 0) {
          msg.finish();
          return;
        } else {
          for (const sink of sinks.rows) {
            // Check if sendEventsToVectorSource is already running for the current sink.id
            if (sendEventsRunningStatus[sink.id]) {
              logger.info(`sendEventsToVectorSource is already running for sink ${sink.id}, skipping...`);
              continue;
            }

            // Set the running status of sendEventsToVectorSource to true for the current sink.id
            sendEventsRunningStatus[sink.id] = true;

            // Get the latest received from ingest_task
            const latestReceived = await getLatestEventTimestampForSink(sink);
            logger.info(
              `Latest received for ${sink.project_id}/${sink.environment_id}/${
                sink.group_id
              } is ${+latestReceived}`
            );
            // get cursor from pg for each group
            let startCursor;
            const cursor = await getCursorForSink(sink);
            if (cursor.rowCount === 0) {
              // cursor does not exists, start from beginning
              await insertSinkCursor(sink);
              startCursor = "";
            } else {
              // check if previous events missed
              const sinkConfig = configManagerInstance.getConfigBySinkId(sink.id);
              if (!sinkConfig) {
                logger.info(`Config not found for sink ${sink.id} in ConfigManager, skipping!`);
                continue;
              }

              const { sourceName, sinkName } = sinkConfig;
              if (
                configManagerInstance.sentEvents[sourceName] &&
                configManagerInstance.sentEvents[sinkName] &&
                configManagerInstance.receivedEvents[sourceName] &&
                configManagerInstance.receivedEvents[sinkName]
              ) {
                if (
                  configManagerInstance.receivedEvents[sourceName] ===
                  configManagerInstance.sentEvents[sourceName]
                ) {
                  if (
                    configManagerInstance.sentEvents[sourceName] ===
                    configManagerInstance.receivedEvents[sinkName]
                  ) {
                    const diff =
                      configManagerInstance.receivedEvents[sinkName] -
                      (configManagerInstance.sentEvents[sinkName] +
                        configManagerInstance.sinkRetryDiff[sinkName] || 0);
                    if (
                      configManagerInstance.receivedEvents[sinkName] ===
                      (configManagerInstance.sentEvents[sinkName] +
                        configManagerInstance.sinkRetryDiff[sinkName] || 0)
                    ) {
                      // no events missed
                      startCursor = cursor.rows[0].cursor;
                    } else {
                      // events missed
                      logger.info(
                        `[${diff}]Events missed for ${sinkName} [${
                          configManagerInstance.receivedEvents[sinkName]
                        } => ${
                          configManagerInstance.sentEvents[sinkName] +
                          (configManagerInstance.sinkRetryDiff[sinkName] || 0)
                        }] in last tick. waiting...`
                      );
                      continue;
                    }
                  } else {
                    // sink is behind
                    continue;
                  }
                } else {
                  // source is behind
                  continue;
                }
              } else {
                // no events sent/received yet
                startCursor = cursor.rows[0].cursor;
              }
            }
            // create Sink instance
            const sinkInstance = getSinkInstance(sink.config);
            const healthCheck = await sinkInstance.healthCheck();
            if (!healthCheck) {
              logger.info(`Sink ${sink.id} is not healthy, skipping...`);
              continue;
            }
            let events;
            let from = 0;
            let cursorToSave;
            do {
              try {
                const decoded = startCursor ? decodeCursor(startCursor) : [0];
                const beforeTs = latestReceived ? Math.min(+latestReceived, windowEnd) : windowEnd;
                // if cursor is greater than beforeTs, then skip
                if (startCursor && decoded[0] > beforeTs) {
                  logger.info(
                    `startCursor(${decoded[0]}) is greater than beforeTs(${beforeTs}), skipping...`
                  );
                  break;
                }
                // get events from pg or es depending on PG_SEARCH
                events = await searchByReceived(
                  { size: batchSize, after: startCursor, before: beforeTs, from },
                  {
                    projectId: sink.project_id,
                    environmentId: sink.environment_id,
                    groupId: sink.group_id,
                  }
                );
                logger.info(
                  `Found ${events.edges.length}/${events.totalCount} events for ${sink.project_id}/${sink.environment_id}/${sink.group_id}`
                );
                if (events.edges.length === 0) {
                  break;
                }
                // send for processing to vector
                await sendEventsToVectorSource(events, sink, eventsPerBatch, sinkInstance);

                cursorToSave = events.edges[events.edges.length - 1].cursor;

                from += events.edges.length;
                if (from + batchSize >= 10000) {
                  logger.info(
                    `Reached max limit of 10000 events for ${sink.project_id}/${sink.environment_id}/${sink.group_id}`
                  );

                  const [timestamp, id] = decodeCursor(cursorToSave);
                  const newCursor = encodeCursor(timestamp - 1, id);
                  startCursor = newCursor;
                  from = 0;
                }
              } catch (ex) {
                logger.error(ex);
                startCursor = cursorToSave;
              }
            } while (events?.edges?.length && events?.edges?.length > 0);
            await updateCursorsForSink(cursorToSave, startCursor, sink);
            // After sendEventsToVectorSource is completed, set the running status to false
            sendEventsRunningStatus[sink.id] = false;
          }
          msg.finish();
        }
      } catch (ex) {
        logger.error(ex);
        msg.requeue(15000, true);
      }
    },
    {
      maxAttempts: 1,
      maxInFlight: 5,
      messageTimeoutMS: 100000,
    }
  );
}

async function getLatestEventTimestampForSink(sink: any) {
  try {
    const res = await pg.query(
      `
            SELECT MAX(received) as max
            FROM ingest_task
            WHERE normalized_event IS NOT NULL
              AND project_id = $1
              AND environment_id = $2
              AND (normalized_event::jsonb->'group'->>'id') = $3;`,
      [sink.project_id, sink.environment_id, sink.group_id]
    );
    if (res.rows.length > 0) {
      return res.rows[0].max;
    }
  } catch (ex) {
    logger.error(ex);
  }
}

async function insertSinkCursor(sink: any) {
  const id = uniqueId();
  await pg.query(
    "INSERT INTO group_cursor (id, project_id, environment_id, group_id, previous_cursor, cursor) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, sink.project_id, sink.environment_id, sink.group_id, "", ""]
  );
}

async function getSinksByIds(keys: string[]) {
  const q = `SELECT * FROM vectorsink WHERE id IN ('${keys.join("','")}')`;
  const sinks = await pg.query(q);
  return sinks;
}

async function getCursorForSink(sink: any) {
  return await pg.query(
    "SELECT * FROM group_cursor WHERE project_id = $1 AND environment_id = $2 AND group_id = $3",
    [sink.project_id, sink.environment_id, sink.group_id]
  );
}

async function updateCursorsForSink(cursor: any, previousCursor: any, sink: any) {
  if (cursor) {
    // update cursor in pg
    await pg.query(
      "UPDATE group_cursor SET cursor = $1, previous_cursor = $2 WHERE project_id = $3 AND environment_id = $4 AND group_id = $5",
      [cursor, previousCursor, sink.project_id, sink.environment_id, sink.group_id]
    );
  }
}

async function sendEventsToVectorSource(events: any, sink: any, eventBatchSize = 100, instance: Sink) {
  const eventEdges = events.edges;
  const numBatches = Math.ceil(eventEdges.length / eventBatchSize);

  const backoffStrategy = new ExponentialStrategy({
    initialDelay: 100, // initial delay in milliseconds
    maxDelay: 60 * 1000, // maximum delay in milliseconds
  });

  for (let i = 0; i < numBatches; i++) {
    const batch = eventEdges.slice(i * eventBatchSize, (i + 1) * eventBatchSize);
    const promises = batch.map(async (edge: any) => {
      const functionCall = call(() => {
        return instance.sendEvent(edge?.node);
        // return axios.post(
        //   `${config.VECTOR_HOST_PROTOCOL}://${config.VECTOR_HOST}:${
        //     ConfigManager.getInstance().configs[sink.id].sourceHttpPort
        //   }`,
        //   {
        //     message: JSON.stringify(edge?.node),
        //   }
        // );
      });

      functionCall.retryIf((err) => {
        // Retry if the status is not 200
        return err.response && err.response.status !== 200;
      });

      functionCall.setStrategy(backoffStrategy);

      try {
        await functionCall.start();
      } catch (error) {
        logger.error(
          `Error sending event to vector: ${error.response.status} - ${error.response.statusText}`
        );
      }
    });

    await Promise.all(promises);
  }
}
