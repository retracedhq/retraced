import * as AWS from "aws-sdk";

import getConfig from "../config/getConfig";

const config = getConfig();
var docClient;  // the reusable object

export default function getDocClient() {
  if (!docClient) {
    AWS.config.update({
      region: config.DynamoDB.Region,
      endpoint: config.DynamoDB.Endpoint,
      credentials: new AWS.Credentials(config.DynamoDB.AccessKey, config.DynamoDB.SecretKey),
    });

    docClient = new AWS.DynamoDB.DocumentClient();
  }

  return docClient;
}
