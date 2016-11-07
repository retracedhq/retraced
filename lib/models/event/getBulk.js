'use strict';

const _ = require('lodash');
const uuid = require('uuid');
require('datejs');
const AWS = require('aws-sdk');

const config = require('../../config/getConfig')();
// const scylladb = require('../../persistence/scylla')();
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

    // This will be the ScyllaDB query when we switch over.
    /*
    const selectStmt = `select
      id, actor_id, object_id, description, action, crud, is_failure, is_anonymous, created, received, team_id, source_ip, country, loc_subdiv1, loc_subdiv2
      from retraced.event
      where id in ?;
    `;

    scylladb.execute(selectStmt, opts.event_ids, (err, result) => {
      if (err) {
        console.log(err.stack);
        reject(err);
        return;
      }

      if (result.rows && result.rows.length > 0) {
        resolve(result.rows);
      } else {
        resolve([]);
      }
    });
    */
  });
}

module.exports = getEventsBulk;
