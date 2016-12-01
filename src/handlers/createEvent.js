import * as uuid from "uuid";
import * as AWS from "aws-sdk";
import * as util from "util";

import validateEvent from "../models/event/validate";
import checkAccess from "../security/checkAccess";
import validateApiToken from "../security/validateApiToken";
import getConfig from "../config/getConfig";
import getDisque from "../persistence/disque";
import getPgPool from "../persistence/pg";

const config = getConfig();
const disque = getDisque();
const pgPool = getPgPool();

export default function handler(req) {
  return new Promise((resolve, reject) => {
    let apiToken;
    validateApiToken(req.get("Authorization"))
      .then((t) => {
        apiToken = t;
        return checkAccess({
          api_token: apiToken,
          project_id: req.params.projectId,
        });
      })
      .then((valid) => {
        if (!valid) {
          reject({ status: 401, err: new Error("Unauthorized") });
          return null;
        }

        return validateEvent({
          event: req.body,
        });
      })
      .then((valid) => {
        if (!valid) {
          reject({ status: 400, err: new Error("Bad request") });
          return;
        }
      })
      .then(async () => {
        // Create a new ingestion task for each event passed in.
        let eventsIn = req.body;
        if (!Array.isArray(req.body)) {
          eventsIn = [req.body];
        }

        for (const event of eventsIn) {
          const pg = await pgPool.connect();
          const insertStmt = `insert into ingest_task (
            id, original_event, project_id, environment_id
          ) values (
            $1, $2, $3, $4
          )`;

          const newTaskId = uuid.v4().replace(/-/g, "");
          const insertVals = [
            newTaskId,
            JSON.stringify(event),
            apiToken.project_id,
            apiToken.environment_id,
          ];

          await pg.query(insertStmt, insertVals);
          pg.release();
          const job = JSON.stringify({
            taskId: newTaskId,
          });

          const opts = {
            retry: 600, // seconds
            async: true,
          };

          // This task will normalize the event and save its important bits to postgres.
          // It'll then enqueue tasks for saving to the other databases.
          disque.addjob("normalize_event", job, 0, opts);
        }
      })
      .then(resolve)
      .catch(reject);
  });
};
