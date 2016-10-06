'use strict';

const _ = require('lodash');
const uuid = require('uuid');
require('datejs');
const AWS = require('aws-sdk');
const util = require('util');

const config = require('../../config/getConfig')();
const docClient = require('../../persistence/dynamo')();

function getEventsBulk(opts) {
  return new Promise((resolve, reject) => {
    AWS.config.update({
      region: config.DynamoDB.Region,
      endpoint: config.DynamoDB.Endpoint,
      credentials: new AWS.Credentials(config.DynamoDB.AccessKey, config.DynamoDB.SecretKey),
    });

    const table = `${config.DynamoDB.TablePrefix}event${config.DynamoDB.TableSuffix}`;

    const requestItems = {};
    requestItems[table] = {
      Keys: _.map(opts.event_ids, (eid) => {
        return ({ Id: eid });
      }),
    };
    const params = {
      RequestItems: requestItems,
    };

    const allEvents = [];

    const cb = (err, resp) => {
      if (err) {
        reject(err);
        return;
      }

      _.forEach(resp.Responses[table], (r) => {
        allEvents.push(r);
      });

      if (resp.UnprocessedKeys && resp.UnprocessedKeys.length > 0) {
        docClient.batchGet({ RequestItems: resp.UnprocessedKeys }, cb);
        return;
      }
      resolve(allEvents);
    };

    docClient.batchGet(params, cb);
  });
}

module.exports = getEventsBulk;
