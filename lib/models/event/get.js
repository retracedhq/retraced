'use strict';

let docClient = require('../../persistence/dynamo')();
let config = require('../../config/getConfig')();

function getEvent(opts) {
  return new Promise((resolve, reject) => {
    let table = config.DynamoDB.TablePrefix + 'event' + config.DynamoDB.TableSuffix;

    // TODO holy crap, we need to make sure the project and environment match or 
    // this is a huge security problem

    var params = {
      TableName: config.DynamoDB.TablePrefix + 'event' + config.DynamoDB.TableSuffix,
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
