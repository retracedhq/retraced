var AWS = require("aws-sdk");
var config = require('../config/getConfig')();
var docClient;
function getDocClient() {
    if (!docClient) {
        AWS.config.update({
            region: config.DynamoDB.Region,
            endpoint: config.DynamoDB.Endpoint,
            credentials: new AWS.Credentials(config.DynamoDB.AccessKey, config.DynamoDB.SecretKey)
        });
        docClient = new AWS.DynamoDB.DocumentClient();
    }
    return docClient;
}
module.exports = getDocClient;
//# sourceMappingURL=dynamo.js.map