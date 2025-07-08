import dbClient from "../db/dbClient";
import {
  PutItemCommand,
  ScanCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { type Office } from "../types/Office";

export function officeService() {
  const tableName = process.env.DYNAMODB_TABLE_NAME!;

  const createOffice = async (body: Office) => {
    const { officeId, name, location, region } = body;

    const timestamp = new Date().toISOString();

    const command = new PutItemCommand({
      TableName: tableName,
      Item: {
        PK: { S: `OFFICE#${officeId}` },
        SK: { S: `METADATA` },
        officeId: { S: officeId },
        name: { S: name },
        location: { S: location },
        region: { S: region },
        createdAt: { S: timestamp },
      },
      ConditionExpression: "attribute_not_exists(PK)",
    });

    await dbClient.send(command);

    return {
      message: "Office created successfully.",
      officeId,
    };
  };

  const getOffices = async (): Promise<Office[]> => {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: "SK = :sk",
      ExpressionAttributeValues: {
        ":sk": { S: "METADATA" },
      },
    });

    const response = await dbClient.send(command);
    return response.Items?.map((item) => unmarshall(item) as Office) ?? [];
  };

  const getOfficeById = async (officeId: string): Promise<Office | null> => {
    const command = new GetItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: `OFFICE#${officeId}` },
        SK: { S: "METADATA" },
      },
    });

    const response = await dbClient.send(command);
    return response.Item ? (unmarshall(response.Item) as Office) : null;
  };
  return {
    createOffice,
    getOffices,
    getOfficeById,
  };
}
