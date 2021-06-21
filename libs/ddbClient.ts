import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DYNAMO_CONFIG } from "../config/GeneralConfig";
// Set the AWS Region.
// Create an Amazon DynamoDB service client object.
const ddbClient = new DynamoDBClient({ region: DYNAMO_CONFIG.region });
export { ddbClient };
