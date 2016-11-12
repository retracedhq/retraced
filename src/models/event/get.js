

const docClient = require('../../persistence/dynamo')();
// const scylladb = require('../../persistence/scylla')();
const config = require('../../config/getConfig')();

function getEvent(opts) {
  return new Promise((resolve, reject) => {
    // TODO holy crap, we need to make sure the project and environment match or
    // this is a huge security problem

    let table;
    if (config.DynamoDB.TablePrefix) {
      table = `${config.DynamoDB.TablePrefix}-`;
    }
    table = `${table}event`;
    if (config.DynamoDB.TableSuffix) {
      table = `${table}-${config.DynamoDB.TableSuffix}`;
    }

    const params = {
      TableName: table,
      Key: {
        id: opts.event_id,
      },
    };

    docClient.get(params, (err, data) => {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }

      resolve(data.Item);
    });

    // This will be the ScyllaDB query when we switch over.
    /*
    const selectStmt = `select
      id, actor_id, object_id, description, action, crud, is_failure, is_anonymous, created, received, team_id, source_ip, country, loc_subdiv1, loc_subdiv2
      from retraced.event
      where id = ?;
    `;

    scylladb.execute(selectStmt, [opts.event_id], (err, result) => {
      if (err) {
        console.log(err.stack);
        reject(err);
        return;
      }
      if (result.rows && result.rows.length > 0) {
        resolve(result.rows[0]);
      } else {
        resolve(null);
      }
    });
    */
  });
}

module.exports = getEvent;
