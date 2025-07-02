import dbClient from "../db/dbClient";
import {
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export function papService() {
  const createPap = async (body: any) => {
    if (!body) {
      throw new Error("Missing request body.");
    }

    const { officeId, allotmentId, papId, ...rest } = body;

    // 🔒 Validate: check if the parent allotment exists
    const allotmentKey = {
      PK: `OFFICE-${officeId}`,
      SK: `ALLOTMENT#${allotmentId}`,
    };

    const allotmentResult = await dbClient.send(
      new GetItemCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: marshall(allotmentKey),
      })
    );

    if (!allotmentResult.Item) {
      throw new Error("Referenced Allotment ID does not exist.");
    }

    // ✅ Proceed to create PAP
    const newPAP = {
      PK: `ALLOTMENT#${allotmentId}`,
      SK: `PAP#${papId}`,
      type: "pap",
      ...rest,
    };

    await dbClient.send(
      new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: marshall(newPAP),
      })
    );

    return newPAP;
  };

  const getPAPsByAllotment = async (allotmentId: string) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: `ALLOTMENT#${allotmentId}` },
        ":sk": { S: "PAP#" },
      },
    };

    const result = await dbClient.send(new QueryCommand(params));
    return result.Items?.map((item) => unmarshall(item));
  };

  const getPAP = async (allotmentId: string, papId: string) => {
    try {
      const papKey = {
        PK: `ALLOTMENT#${allotmentId}`,
        SK: `PAP#${papId}`,
      };

      const papResult = await dbClient.send(
        new GetItemCommand({
          TableName: process.env.DYNAMODB_TABLE_NAME!,
          Key: marshall(papKey),
        })
      );

      if (!papResult.Item) return null;

      return unmarshall(papResult.Item);
    } catch (error) {
      throw error;
    }
  };

  const deletePAP = async () => {};
  return {
    createPap,
    getPAPsByAllotment,
    getPAP,
    deletePAP,
  };
}
