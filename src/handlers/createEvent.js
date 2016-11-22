const uuid = require("uuid");
const AWS = require("aws-sdk");
const util = require("util");

const config = require("../config/getConfig")();
const validateEvent = require("../models/event/validate");
const checkAccess = require("../security/checkAccess");
const validateApiToken = require("../security/validateApiToken");
const disque = require("../persistence/disque")();

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
          ingestTaskId: uuid.v4().replace(/-/g, ""),
          projectId: apiToken.project_id,
          environmentId: apiToken.environment_id,
          events: req.body,
        });

        const opts = {
          retry: 600, // seconds
        };
        return disque.addjob("create_ingestion_task", job, opts);
      })
      .then(resolve)
      .catch(reject);
  });
};

module.exports = handler;
