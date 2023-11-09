import nsq from "../../../_processor/persistence/nsq";
import { handleSinkCreated, handleSinkDeleted, handleSinkUpdated } from "../services/vector";
import getPgPool from "../../../persistence/pg";
import { ConfigManager } from "../services/configManager";
import uniqueId from "../../../models/uniqueId";
import search from "../../../handlers/graphql/search";
import axios from "axios";

const pg = getPgPool();
let pullHandlerRunning = false;

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
        console.log(ex);
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
    async (msg) => {
      try {
        const sink = JSON.parse(msg.body);
        await handleSinkDeleted(sink);
        msg.finish();
      } catch (ex) {
        console.log(ex);
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
        console.log(ex);
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
        if (pullHandlerRunning) {
          msg.finish();
          return;
        }
        pullHandlerRunning = true;
        const keys = Object.keys(ConfigManager.getInstance().configs);
        const instance = ConfigManager.getInstance();
        if (keys.length === 0) {
          msg.finish();
          pullHandlerRunning = false;
          return;
        }
        const q = `SELECT * FROM vectorsink WHERE id IN ('${keys.join("','")}')`;
        console.log(q);
        const sinks = await pg.query(q);
        if (sinks.rowCount === 0) {
          msg.finish();
          pullHandlerRunning = false;
          return;
        } else {
          for (const sink of sinks.rows) {
            // get cursor from pg for each group
            let startCursor;
            const cursor = await pg.query(
              "SELECT * FROM group_cursor WHERE project_id = $1 AND environment_id = $2 AND group_id = $3",
              [sink.project_id, sink.environment_id, sink.group_id]
            );
            if (cursor.rowCount === 0) {
              // cursor does not exists, start from beginning
              const id = uniqueId();
              await pg.query(
                "INSERT INTO group_cursor (id, project_id, environment_id, group_id, previous_cursor, cursor) VALUES ($1, $2, $3, $4, $5, $6)",
                [id, sink.project_id, sink.environment_id, sink.group_id, "", ""]
              );
              startCursor = "";
            } else {
              // check if previous events missed
              const config = instance.getConfigBySinkId(sink.id);
              if (!config) {
                console.warn(`Config not found for sink ${sink.id} in ConfigManager, skipping!`);
                continue;
              }
              const { sourceName, sinkName } = config;
              if (
                instance.sentEvents[sourceName] &&
                instance.sentEvents[sinkName] &&
                instance.receivedEvents[sourceName] &&
                instance.receivedEvents[sinkName]
              ) {
                if (instance.receivedEvents[sourceName] == instance.sentEvents[sourceName]) {
                  if (instance.sentEvents[sourceName] == instance.receivedEvents[sinkName]) {
                    const diff =
                      instance.receivedEvents[sinkName] -
                      (instance.sentEvents[sinkName] + instance.sinkRetryDiff[sinkName] || 0);
                    if (
                      instance.receivedEvents[sinkName] ==
                      (instance.sentEvents[sinkName] + instance.sinkRetryDiff[sinkName] || 0)
                    ) {
                      // no events missed
                      startCursor = cursor.rows[0].cursor;
                    } else {
                      // events missed
                      console.log(
                        `[${diff}]Events missed for ${sinkName} [${instance.receivedEvents[sinkName]} => ${
                          instance.sentEvents[sinkName] + (instance.sinkRetryDiff[sinkName] || 0)
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
            // get events from pg or es depending on PG_SEARCH
            const events = await search(
              undefined,
              { query: "", first: 1000, after: startCursor },
              {
                projectId: sink.project_id,
                environmentId: sink.environment_id,
                groupId: sink.group_id,
              }
            );
            console.log(
              `Found ${events.edges.length}/${events.totalCount} events for ${sink.project_id}/${sink.environment_id}/${sink.group_id}`
            );
            if (events.edges.length === 0) {
              continue;
            }
            // send for processing to vector
            // TODO: send one by one and wait for response to check 429s
            events.edges.forEach((event) => {
              axios.post(`http://localhost:${ConfigManager.getInstance().configs[sink.id].sourceHttpPort}`, {
                message: JSON.stringify(event),
              });
            });
            // update cursor in pg
            await pg.query(
              "UPDATE group_cursor SET cursor = $1, previous_cursor = $2 WHERE project_id = $3 AND environment_id = $4 AND group_id = $5",
              [
                events.edges[events.edges.length - 1].cursor,
                startCursor,
                sink.project_id,
                sink.environment_id,
                sink.group_id,
              ]
            );
          }
          msg.finish();
          pullHandlerRunning = false;
        }
      } catch (ex) {
        pullHandlerRunning = false;
        console.log(ex);
        msg.requeue(15000, true);
      }
    },
    {
      maxAttempts: 1,
      maxInFlight: 5,
      messageTimeoutMS: 10000,
    }
  );
}
