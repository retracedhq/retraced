const docClient = require('../../persistence/dynamo')();
const config = require('../../config/getConfig')();
function getEvent(opts) {
    return new Promise((resolve, reject) => {
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
    });
}
module.exports = getEvent;
//# sourceMappingURL=get.js.map