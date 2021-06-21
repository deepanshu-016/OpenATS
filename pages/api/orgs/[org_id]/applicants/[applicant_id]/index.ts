import { NextApiRequest, NextApiResponse } from "next";
import {
  DYNAMO_TABLE_NAME,
  FORBIDDEN_KEYS,
} from "../../../../../../config/GeneralConfig";

import {
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Dynamo } from "../../../../../../libs/ddbDocClient";

import { ErrorLogger } from "../../../../../../utils/ErrorLogger";
import GetStatus from "../../../../../../utils/GetErrorStatus";

/**
 * Route - /api/orgs/:org_id/applicants/:applicant_id
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query, body } = req;
  const { org_id, applicant_id } = query;

  /**
   * Retrieve an applicant form an org
   * @param applicant_id - The id of the applicant you want to retrieve
   */
  if (method === "GET") {
    let params: any = {
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
      ExpressionAttributeNames: {
        "#pk": `PK`,
        "#sk": `SK`,
      },
      ExpressionAttributeValues: {
        ":pk": `ORG#${org_id}`,
        ":sk": `ORG#${org_id}#APPLICANT#${applicant_id}`,
      },
      TableName: DYNAMO_TABLE_NAME,
    };

    try {
      let results: any = [];
      let response = await Dynamo.send(new QueryCommand(params));

      do {
        // Loop continuously untl all items are returned
        response?.Items!.forEach((item) => results.push(item));
        params.ExclusiveStartKey = response.LastEvaluatedKey;
      } while (typeof response.LastEvaluatedKey != "undefined");

      return res.status(200).send(results);
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message: `An error occurred getting your applicant: ${error?.message}`,
      });
    }
  }

  /**
   * Delete an applicant from an org
   * @param applicant_id - ID of the applicant you want to delete
   */
  if (method === "DELETE") {
    const params = {
      Key: {
        PK: `ORG#${org_id}`,
        SK: `ORG#${org_id}#APPLICANT#${applicant_id}`,
      },
      TableName: DYNAMO_TABLE_NAME,
      ConditionExpression: "attribute_exists(PK)",
    };

    try {
      const response = await Dynamo.send(new DeleteCommand(params));
      console.log(response);
      return res.status(200).json({
        message: `Applicant with ID ${applicant_id} has been deleted`,
      });
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message:
          error?.message == "The conditional request failed"
            ? `Unable to delete applicant: ID of '${applicant_id}' does not exist`
            : `An error occurred deleting your applicant: ${error?.message}`,
      });
    }
  }

  /**
   * Update an applicant inside an org
   * @param applicant_id - ID of the applicant you want to update
   */
  if (method === "PUT") {
    /**
     * Some applicant properties should not be updated via API
     * Here, we filter these keys out so they don't get updated
     * See GeneralConfig.ts for these list of keys
     */
    const incomingKeys = Object.keys(body);
    const newKeys = incomingKeys.filter((key) => !FORBIDDEN_KEYS.includes(key));

    let newUpdateExpression: string[] = [];
    let newAttributes: any = {};

    newKeys.forEach((key) => {
      newUpdateExpression.push(`SET ${key} = :${key}`);
      newAttributes[`:${key}`] = body[key];
    });

    const UpdatedExpression = newUpdateExpression.join(", ").toString();

    const params = {
      Key: {
        PK: `ORG#${org_id}`,
        SK: `ORG#${org_id}#APPLICANT#${applicant_id}`,
      },
      UpdateExpression: UpdatedExpression,
      ExpressionAttributeValues: newAttributes,
      TableName: DYNAMO_TABLE_NAME,
      ReturnValues: "ALL_NEW",
      ConditionExpression: "attribute_exists(PK)", // TODO remove this? Let any attribute be updated
    };

    try {
      const response = await Dynamo.send(new UpdateCommand(params));
      return res.status(200).json({
        message: `Applicant updated succesfully`,
        applicant: response.Attributes,
      });
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message:
          error?.message == "The conditional request failed"
            ? `Unable to update applicant: ID of '${applicant_id}' does not exist`
            : `An error occurred updating your applicant: ${error?.message}`,
      });
    }
  }
  return res.status(405).json({ message: `Method Not Allowed - ${method}` });
};
