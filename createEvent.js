'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
const util = require('util');

const config = require('./lib/config/getConfig')();
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
      const message = {
        id: uuid.v4().replace(/-/g, ''),
        request: event.body,
        api_token: apiToken,
      };

      if (event.isOffline) {
        // Write the event now.  We don't have offline queuing.
        return new Promise((resolve, reject) => {
          processEvent(message)
          .then(() => resolve(message.id))
          .catch(reject);
        });
      }

      AWS.config.update({
        region: config.SNS.Region,
        endpoint: config.SNS.Endpoint,
        credentials: new AWS.Credentials(config.SNS.AccessKey, config.SNS.SecretKey),
      });
      const sns = new AWS.SNS({ region: config.SNS.Region });

      const params = {
        Message: JSON.stringify(message),
        TopicArn: `arn:aws:sns:${config.SNS.Region}:${config.SNS.AccountID}:${config.SNS.EventProcessorTopic}`,
      };

      return new Promise((resolve, reject) => {
        sns.publish(params, (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
            return;
          }

          resolve(message.id);
        });
      });
    })
    .then((id) => {
      cb(null, { id });
    })
    .catch((err) => {
      console.log(err.stack);
      cb(new Error('[500] Internal Server Error'));
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
