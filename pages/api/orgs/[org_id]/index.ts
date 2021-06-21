import { NextApiRequest, NextApiResponse } from "next";
import { DYNAMO_TABLE_NAME } from "../../../../config/GeneralConfig";

import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { Dynamo } from "../../../../libs/ddbDocClient";

import { ErrorLogger } from "../../../../utils/ErrorLogger";
import GetStatus from "../../../../utils/GetErrorStatus";

/**
 * Route - /api/organizations/:org_id
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query, body } = req;
  const { org_id } = query;

  /**
   * Retrieve an org
   * @param org_id - The id of the org you want to retrieve
   */
  if (method === "GET") {
    const params = {
      Key: {
        PK: `ORG#${org_id}`,
        SK: `ORG#${org_id}`,
      },
      TableName: DYNAMO_TABLE_NAME,
    };
    try {
      const response = await Dynamo.send(new GetCommand(params));
      if (response.Item == undefined)
        return res
          .status(404)
          .json({ message: `Org with ID ${org_id} not found` });

      return res.status(200).send(response.Item);
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message: `An error occurred getting your organization: ${error?.message}`,
      });
    }
  }

  return res.status(405).json({ message: `Method Not Allowed - ${method}` });
};
