let docClient = require('../../persistence/dynamo')();
let config = require('../../config/getConfig')();
function searchEvents(opts) {
    return new Promise((resolve, reject) => {
        let projectId = opts.project_id;
        let environmentId = opts.environment_id;
        var table;
        if (config.DynamoDB.TablePrefix) {
            table = config.DynamoDB.TablePrefix + '-';
        }
        table = table + 'event';
        if (config.DynamoDB.TableSuffix) {
            table = table + '-' + config.DynamoDB.TableSuffix;
        }
        let params = {
            TableName: table,
            IndexName: 'environment_id-received-index',
            KeyConditionExpression: 'environment_id = :environmentId',
            ExpressionAttributeValues: {
                ':environmentId': environmentId,
            },
            ScanIndexForward: false,
        };
        if (opts.team_id) {
            params.FilterExpression = '(team_id=:teamId)';
            params.ExpressionAttributeValues[':teamId'] = opts.team_id;
        }
        docClient.query(params, (err, events) => {
            if (err) {
                console.log(err);
                reject(err);
                return;
            }
            if (events.Count === 0) {
                resolve([]);
                return;
            }
            resolve(events.Items);
        });
    });
}
module.exports = searchEvents;
//# sourceMappingURL=search.js.map