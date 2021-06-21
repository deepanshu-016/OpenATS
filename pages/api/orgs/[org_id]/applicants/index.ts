import { NextApiRequest, NextApiResponse } from "next";
import {
  DYNAMO_TABLE_NAME,
  APPLICANT_ID_LENGTH,
} from "../../../../../config/GeneralConfig";

import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Dynamo } from "../../../../../libs/ddbDocClient";

import { ErrorLogger } from "../../../../../utils/ErrorLogger";
import GetStatus from "../../../../../utils/GetErrorStatus";
import { nanoid } from "nanoid";

/**
 * Route - /api/orgs/:org_id/applicants
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query, body } = req;
  const { org_id } = query;
  /**
   * Create an applicant
   * @param applicant_name - The name of the applicant
   * @param org_id - The organization this applicant belongs to
   */
  if (method === "POST") {
    const { applicant_name } = body;
    if (!applicant_name)
      return res.status(400).json({
        message: `Must include 'applicant_name' in the BODY of your request. Received: ${Object.keys(
          body
        ).join(", ")}`,
      });

    const applicant_id = nanoid(APPLICANT_ID_LENGTH);
    const current_time = new Date().toISOString();

    const params = {
      Item: {
        PK: `ORG#${org_id}`,
        SK: `ORG#${org_id}#APPLICANT#${applicant_id}`,
        applicant_name: applicant_name,
        applicant_id: applicant_id,
        object_type: `APPLICANT`,
        created_at: current_time,
      },
      TableName: DYNAMO_TABLE_NAME,
      ConditionExpression:
        "attribute_not_exists(PK) AND attribute_not_exists(SK)",
    };

    try {
      await Dynamo.send(new PutCommand(params));
      return res.status(201).json({
        message: `Applicant succesfully created!`,
        applicant: {
          applicant_name: applicant_name,
          applicant_id: applicant_id,
          created_at: current_time,
        },
      });
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message: `An error occurred creating your applicant: ${error?.message}`,
      });
    }
  }

  /**
   * Get all applicants in an org
   * @param org_id - Get all applicants by org_id
   */
  if (method === "GET") {
    let params: any = {
      KeyConditionExpression: "#pk = :pk AND #sk = :sk",
      ExpressionAttributeNames: {
        "#pk": `object_type`,
        "#sk": `PK`,
      },
      ExpressionAttributeValues: {
        ":pk": `APPLICANT`,
        ":sk": `ORG#${org_id}`,
      },
      TableName: DYNAMO_TABLE_NAME,
      IndexName: "AllByType",
    };

    try {
      let results: any = [];
      let response = await Dynamo.send(new QueryCommand(params));

      do {
        // Loop continuously until all items are returned
        response?.Items!.forEach((item) => results.push(item));
        params.ExclusiveStartKey = response.LastEvaluatedKey;
      } while (typeof response.LastEvaluatedKey != "undefined");

      return res.status(200).send(results);
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message: `An error occurred retrieving your organizations: ${error?.message}`,
      });
    }
  }
  return res.status(405).json({ message: `Method Not Allowed - ${method}` });
};
