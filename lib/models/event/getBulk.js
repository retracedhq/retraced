'use strict';

const _ = require('lodash');
const uuid = require('uuid');
require('datejs');
const AWS = require('aws-sdk');

const config = require('../../config/getConfig')();
const docClient = require('../../persistence/dynamo')();

function getEventsBulk(opts) {
  return new Promise((resolve, reject) => {
    AWS.config.update({
      region: config.DynamoDB.Region,
      endpoint: config.DynamoDB.Endpoint,
      credentials: new AWS.Credentials(config.DynamoDB.AccessKey, config.DynamoDB.SecretKey),
    });

    let table;
    if (config.DynamoDB.TablePrefix) {
      table = `${config.DynamoDB.TablePrefix}-`;
    }
    table = `${table}event`;
    if (config.DynamoDB.TableSuffix) {
      table = `${table}-${config.DynamoDB.TableSuffix}`;
    }

    const requestItems = {};
    requestItems[table] = {
      Keys: _.map(opts.event_ids, (eid) => {
        return ({ id: eid });
      }),
    };
    const initialParams = {
      RequestItems: requestItems,
    };

    console.log(initialParams);
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
        const moreParams = { RequestItems: resp.UnprocessedKeys };
        docClient.batchGet(moreParams, cb);
        return;
      }
      resolve(allEvents);
    };

    docClient.batchGet(initialParams, cb);
  });
}

module.exports = getEventsBulk;
