'use strict';

let docClient = require('../../persistence/dynamo')();
let config = require('../../config/getConfig')();

function getEvent(opts) {
  return new Promise((resolve, reject) => {
    // TODO holy crap, we need to make sure the project and environment match or 
    // this is a huge security problem

    var table;
    if (config.DynamoDB.TablePrefix) {
      table = config.DynamoDB.TablePrefix + '-';
    }
    table = table + 'event';
    if (config.DynamoDB.TableSuffix) {
      table = '-' + config.DynamoDB.TableSuffix;
    }

    var params = {
      TableName: table;
      Key: {
        id: opts.event_id
      }
    }

    docClient.get(params, (err, data) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      resolve(data.Item);
    });
  });
}


module.exports = getEvent;
