import nsq from "../../../_processor/persistence/nsq";
import getPgPool from "../../../persistence/pg";
import uniqueId from "../../../models/uniqueId";
import { searchByReceived, encodeCursor, decodeCursor } from "../../../handlers/graphql/search";
import { logger } from "../../../logger";
import { getSinkInstance } from "../../sinks";

const pg = getPgPool();
const batchSize = 1000;
const eventsPerBatch = 100;
const sendEventsRunningStatus: { [sinkId: string]: boolean } = {};

export function addConsumers() {
  nsq.consume(
    "pull_events_for_export",
    "sidecar",
    async (msg) => {
      try {
        const windowEnd = +new Date() - 5 * 60 * 1000;
        const sinks = await getAllSinks();
        if (sinks.rowCount === 0) {
          logger.info("No active sinks found, skipping...");
          msg.finish();
          return;
        } else {
          for (const sink of sinks.rows) {
            // Check if sendEvents is already running for the current sink.id
            if (sendEventsRunningStatus[sink.id]) {
              logger.info(`sendEvents is already running for sink ${sink.id}, skipping...`);
              continue;
            }

            // Set the running status of sendEvents to true for the current sink.id
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
              startCursor = cursor.rows[0].cursor;
            }
            // create Sink instance
            const sinkInstance = getSinkInstance(sink.config);
            const healthCheck = await sinkInstance.healthCheck();
            if (!healthCheck) {
              logger.info(`Sink ${sink.id} is not healthy, skipping...`);
              sendEventsRunningStatus[sink.id] = false;
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
                // send for processing to the sink
                await sinkInstance.sendEvents(
                  events.edges.map((e) => e.node),
                  eventsPerBatch
                );

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
            // After sendEvents is completed, set the running status to false
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

async function getAllSinks() {
  const q = `SELECT * FROM security_sink where active = true`;
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
