'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
const util = require('util');

const config = require('./lib/config/getConfig')();
const disque = require('./lib/persistence/disque')();
const validateEvent = require('./lib/models/event/validate');
const checkAccess = require('./lib/security/checkAccess');
const validateApiToken = require('./lib/security/validateApiToken');
const processEvent = require('./lib/models/event/process');

const handler = (event, context, cb) => {
  let apiToken;
  validateApiToken(event)
    .then((t) => {
      apiToken = t;
      return checkAccess({
        api_token: apiToken,
        project_id: event.path.projectId,
      });
    })
    .then((valid) => {
      if (!valid) {
        cb(new Error('[401] Unauthorized'));
        return null;
      }

      return validateEvent({
        event: event.body,
      });
    })
    .then((valid) => {
      if (!valid) {
        cb(new Error('[400] Bad request'));
        return;
      }
    })
    .then(() => {
      const job = {
        projectId: apiToken.project_id,
        environmentId: apiToken.environment_id,
        events: event.body,
      };
      disque.addJob({
        queue: 'create_ingestion_task',
        job: JSON.stringify(job),
        retry: 60, // seconds
        async: true,
      }, (err, resp) => {
        if (err) {
          cb(err);
          return;
        }
        cb(null, '[200] OK');
      });
    })
    .catch((err) => {
      console.log(err.stack);
      cb(err);
    });
};

if (require('./lib/config/getConfig')().IOPipe.ClientID) {
  const iopipe = require('iopipe')({
    clientId: require('./lib/config/getConfig')().IOPipe.ClientID,
  });

  module.exports.default = iopipe(handler);
} else {
  module.exports.default = handler;
}
