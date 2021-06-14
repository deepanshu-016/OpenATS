// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from "next";
import { DYNAMO_CONFIG } from "../../../config/GeneralConfig";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import createApplicantObject from "../../../utils/createApplicantObject";
const { unmarshall } = require("@aws-sdk/util-dynamodb"); // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_util_dynamodb.html

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query, body } = req;
  const client = new DynamoDBClient(DYNAMO_CONFIG);

  if (method == "POST") {
    // Create applicant
    const applicant = createApplicantObject(body);
    const command = new PutItemCommand(applicant);
    try {
      await client.send(command);
      return res.status(201).json({
        message: `Applicant succesfully created!`,
        applicant: unmarshall(applicant.Item),
      });
    } catch (error: unknown) {
      console.error({
        // TODO setup custom logger using JSON format for Cloudwatch
        method: method,
        query: query,
        body: body,
        error: error,
      });
      return res.status(500).json({
        message: `An error occurred creating your applicant: ${error}`,
      });
    }
  }

  if (method == "GET") {
    return res.status(200).json({
      applicants: [
        // Mock data // TODO Remove mock data, make DynamoDB Call
        {
          name: "Jose Valerio",
          funnel: "Developer",
        },
        {
          name: "Vaishnav Parte",
          funnel: "Developer",
        },
      ],
    });
  }

  return res.status(405).json({ message: `Method Not Allowed - ${method}` });
};
