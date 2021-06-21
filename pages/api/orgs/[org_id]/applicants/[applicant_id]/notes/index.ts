import { NextApiRequest, NextApiResponse } from "next";
import {
  DYNAMO_TABLE_NAME,
  APPLICANT_ID_LENGTH,
  NOTE_ID_LENGTH,
} from "../../../../../../../config/GeneralConfig";

import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { Dynamo } from "../../../../../../../libs/ddbDocClient";

import { ErrorLogger } from "../../../../../../../utils/ErrorLogger";
import GetStatus from "../../../../../../../utils/GetErrorStatus";
import { nanoid } from "nanoid";

/**
 * Route - /api/orgs/:org_id/applicants/:applicant_id/notes
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query, body } = req;
  const { org_id, applicant_id } = query;
  const { note_message } = body;

  /**
   * Create a note for an applicant
   * @param note_message - Message for the note
   */
  if (method === "POST") {
    if (!note_message)
      return res.status(400).json({
        message: `Must include 'note_message' in the BODY of your request. Received: ${Object.keys(
          body
        ).join(", ")}`,
      });
    const note_id = nanoid(NOTE_ID_LENGTH);
    const current_time = new Date().toISOString();

    const params = {
      Item: {
        PK: `ORG#${org_id}`,
        SK: `ORG#${org_id}#APPLICANT#${applicant_id}#NOTE#${note_id}`,
        note_message: note_message,
        note_id: note_id,
        object_type: `NOTE`,
        created_at: current_time,
        updated_at: current_time,
      },
      TableName: DYNAMO_TABLE_NAME,
      ConditionExpression:
        "attribute_not_exists(PK) AND attribute_not_exists(SK)",
    };
    // TODO check if applicant exists first ?
    try {
      const response = await Dynamo.send(new PutCommand(params));
      console.log(response);
      return res.status(201).json({
        message: `Note succesfully created!`,
        note: {
          note_message: note_message,
          note_id: note_id,
          created_at: current_time,
        },
      });
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message: `An error occurred creating your note: ${error?.message}`,
      });
    }
  }

  return res.status(405).json({ message: `Method Not Allowed - ${method}` });
};
