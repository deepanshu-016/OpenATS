import { nanoid } from "nanoid";
import {
  APPLICANT_ID_LENGTH,
  DYNAMO_TABLE_NAME,
} from "../config/GeneralConfig";
const { marshall } = require("@aws-sdk/util-dynamodb"); // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_util_dynamodb.html

const createApplicantObject = (applicant: { name: string; funnel: string }) => {
  // Given an applicant body
  // Returns a DynamoDB ready input object
  const applicantId = nanoid(APPLICANT_ID_LENGTH);

  const input = {
    Item: marshall({
      PK: applicantId,
      SK: applicantId,
      id: applicantId,
      ...applicant,
      created_at: new Date().toISOString(),
      type: "APPLICANT",
    }),
    TableName: DYNAMO_TABLE_NAME,
  };
  return input;
};

export { createApplicantObject as default };
