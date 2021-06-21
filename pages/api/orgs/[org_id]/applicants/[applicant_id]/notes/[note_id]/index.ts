import { NextApiRequest, NextApiResponse } from "next";
import { DYNAMO_TABLE_NAME } from "../../../../../../../../config/GeneralConfig";

import { DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Dynamo } from "../../../../../../../../libs/ddbDocClient";

import { ErrorLogger } from "../../../../../../../../utils/ErrorLogger";
import GetStatus from "../../../../../../../../utils/GetErrorStatus";

/**
 * Route - /api/orgs/:org_id/applicants/:applicant_id/notes/:note_id
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query, body } = req;
  const { org_id, applicant_id, note_id } = query;

  /**
   * Deletes a note from an applicant
   * @param note_id - The id of the note you want to delete
   */

  if (method === "DELETE") {
    const params = {
      Key: {
        PK: `ORG#${org_id}`,
        SK: `ORG#${org_id}#APPLICANT#${applicant_id}#NOTE#${note_id}`,
      },
      TableName: DYNAMO_TABLE_NAME,
      ConditionExpression: "attribute_exists(PK)",
    };

    try {
      await Dynamo.send(new DeleteCommand(params));
      return res.status(200).json({
        message: `Note with ID ${note_id} has been deleted`,
      });
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message:
          error?.message == "The conditional request failed"
            ? `Unable to delete note: ID of '${note_id}' does not exist`
            : `An error occurred deleting your note: ${error?.message}`,
      });
    }
  }

  /**
   * Updates an applicant's note with a new message
   * @param new_note_message - The new message of the note
   */
  if (method === "PUT") {
    const { new_note_message } = body;

    if (!new_note_message)
      return res.status(400).json({
        message: `Must include 'new_note_message' in the BODY of your request. Received: ${Object.keys(
          query
        ).join(", ")}`,
      });
    const current_time = new Date().toISOString();

    const params = {
      Key: {
        PK: `ORG#${org_id}`,
        SK: `ORG#${org_id}#APPLICANT#${applicant_id}#NOTE#${note_id}`,
      },
      UpdateExpression:
        "SET note_message = :new_note_message, updated_at = :current_time",
      ExpressionAttributeValues: {
        ":new_note_message": new_note_message,
        ":current_time": current_time,
      },
      TableName: DYNAMO_TABLE_NAME,
      ReturnValues: "ALL_NEW",
      ConditionExpression: "attribute_exists(PK)",
    };

    try {
      const response = await Dynamo.send(new UpdateCommand(params));
      return res.status(200).json({
        message: `Note updated succesfully`,
        note: response.Attributes,
      });
    } catch (error: any) {
      ErrorLogger(error, method, query, body);
      return res.status(GetStatus(error)).json({
        message:
          error?.message == "The conditional request failed"
            ? `Unable to update note: ID of '${note_id}' does not exist`
            : `An error occurred updating your note: ${error?.message}`,
      });
    }
  }

  
  return res.status(405).json({ message: `Method Not Allowed - ${method}` });
};
