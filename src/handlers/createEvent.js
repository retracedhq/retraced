const uuid = require('uuid');
const AWS = require('aws-sdk');
const util = require('util');

const config = require('../config/getConfig')();
const validateEvent = require('../models/event/validate');
const checkAccess = require('../security/checkAccess');
const validateApiToken = require('../security/validateApiToken');
const disque = require('../persistence/disque')();

const handler = (req) => {
  return new Promise((resolve, reject) => {
    let apiToken;
    validateApiToken(req.get('Authorization'))
      .then((t) => {
        apiToken = t;
        return checkAccess({
          api_token: apiToken,
          project_id: req.params.projectId,
        });
      })
      .then((valid) => {
        if (!valid) {
          reject({ status: 401, err: new Error('Unauthorized') });
          return null;
        }

        return validateEvent({
          event: req.body,
        });
      })
      .then((valid) => {
        if (!valid) {
          reject({ status: 400, err: new Error('Bad request') });
          return;
        }
      })
      .then(() => {
        const job = {
          projectId: apiToken.project_id,
          environmentId: apiToken.environment_id,
          events: req.body,
        };
        disque.addJob({
          queue: 'create_ingestion_task',
          job: JSON.stringify(job),
          retry: 60, // seconds
          async: true,
        }, (err, resp) => {
          if (err) {
            reject({ status: 500, err });
            return;
          }
          resolve();
        });
      })
      .catch(reject);
  });
}

module.exports = handler;
