import { NextApiRequest, NextApiResponse } from "next";
import {
  DYNAMO_TABLE_NAME,
  ORG_ID_LENGTH,
  ORG_API_KEY_LENGTH,
} from "../../../config/GeneralConfig";

import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Dynamo } from "../../../libs/ddbDocClient";

import { ErrorLogger } from "../../../utils/ErrorLogger";
import GetStatus from "../../../utils/GetErrorStatus";
import { nanoid } from "nanoid";

/**
 * Route - /api/orgs
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query, body } = req;
  const { org_name } = body;

  /**
   * Creates an org
   * @param org_name - The name of the organization that you want to create
   */
  if (method === "POST") {
    if (!org_name)
      return res.status(400).json({
        message: `Must include 'org_name' in the BODY of your request. Received: ${Object.keys(
          body
        ).join(", ")}`,
      });

    const org_id = nanoid(ORG_ID_LENGTH);
    const api_key = nanoid(ORG_API_KEY_LENGTH);
    const current_time = new Date().toISOString();
    const payment_tier = "STANDARD";

    const params = {
      Item: {
        PK: `ORG#${org_id}`,
        SK: `ORG#${org_id}`,
        org_id: org_id,
        org_name: org_name,
        object_type: `ORG`,
        payment_tier: payment_tier,
        api_key: api_key,
        created_at: current_time,
      },
      TableName: DYNAMO_TABLE_NAME,
      ConditionExpression:
        "attribute_not_exists(PK) AND attribute_not_exists(SK)",
    };

    try {
      await Dynamo.send(new PutCommand(params));
      return res.status(201).json({
        message: `Org succesfully created!`,
        org: {
          org_name: org_name,
          org_id: org_id,
          payment_tier: payment_tier,
          created_at: current_time,
          api_key: api_key,
        },
      });
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message: `An error occurred creating your organization: ${error?.message}`,
      });
    }
  }

  /**
   * Get all orgs
   * This uses the GSI `AllByType` which has a PK of object_type
   */
  if (method === "GET") {
    let params: any = {
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": `object_type`,
      },
      ExpressionAttributeValues: {
        ":pk": `ORG`,
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
