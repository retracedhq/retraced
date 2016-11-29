import * as uuid from "uuid";
import * as AWS from "aws-sdk";
import * as util from "util";

import * as getConfig from "../config/getConfig";
import * as validateEvent from "../models/event/validate";
import * as checkAccess from "../security/checkAccess";
import * as validateApiToken from "../security/validateApiToken";
import getDisque from "../persistence/disque";

const config = getConfig();
const disque = getDisque();

const handler = (req) => {
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
      .then(() => {
        const job = JSON.stringify({
          projectId: apiToken.project_id,
          environmentId: apiToken.environment_id,
          events: req.body,
        });

        const opts = {
          retry: 600, // seconds
        };
        return disque.addjob("create_ingestion_task", job, 0, opts);
      })
      .then(resolve)
      .catch(reject);
  });
};

module.exports = handler;
