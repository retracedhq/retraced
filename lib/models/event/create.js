'use strict';

const _ = require('lodash');
const uuid = require('uuid');
require('datejs');
const AWS = require('aws-sdk');
const util = require('util');

const config = require('../../config/getConfig')();
const docClient = require('../../persistence/dynamo')();

/**
 * Asynchronously create a new event with the given options
 *
 * @param {Object} [opts] The request options.
 * @param {Object} [opts.raw] The raw message request received
 */
function createEvent(opts) {
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

    let events = opts.events;
    if (!Array.isArray(events)) {
      events = [events];
    }

    // Flatten actor and object, and normalize.
    const normalizedEvents = _.map(events, (origEvent) => {
      let ev = _.cloneDeep(origEvent);
      ev.actor_id = ev.actor.id;
      _.unset(ev, 'actor');
      if (ev.object) {
        ev.object_id = ev.object.id;
        _.unset(ev, 'object');
      }

      ev = _.omitBy(ev, _.isNil);
      ev = _.omitBy(ev, (val, key) => {
        return _.isEqual(val, '');
      });
      ev = _.mapValues(ev, (val, key) => {
        if (typeof val === 'boolean') {
          return val ? 1 : 0;
        }
        return val;
      });

      return ev;
    });

    const requestItems = {};
    requestItems[table] = _.map(normalizedEvents, (ev) => {
      return {
        PutRequest: {
          Item: ev,
        },
      };
    });
    const params = {
      RequestItems: requestItems,
    };

    const cb = (err, resp) => {
      if (err) {
        console.log(err.stack);
        reject(err);
        return;
      }
      if (resp.UnprocessedItems && resp.UnprocessedItems.length > 0) {
        docClient.batchWrite({ RequestItems: resp.UnprocessedItems }, cb);
        return;
      }
      resolve();
    };

    docClient.batchWrite(params, cb);
  });
}

module.exports = createEvent;
