import dbClient from "../db/dbClient";
import {
  PutItemCommand,
  ScanCommand,
  GetItemCommand,
  QueryCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { type PAPInput } from "../types/PAP";
export function papService() {
  const tableName = process.env.DYNAMODB_TABLE_NAME!;

  const createPAP = async (body: PAPInput) => {
    const { papId, name, status } = body;

    const timestamp = new Date().toISOString();

    const item = {
      PK: `PAP#${papId}`,
      SK: "METADATA",
      papId,
      name,
      status,
      createdAt: timestamp,
    };

    const command = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item),
      ConditionExpression: "attribute_not_exists(PK)",
    });

    await dbClient.send(command);

    return {
      message: "PAP created successfully.",
      papId,
    };
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

  const attachPAPToOffice = async (officeId: string, body: PAPInput) => {
    if (!body) {
      throw new Error("Missing request body.");
    }
    const officeKey = {
      PK: { S: `OFFICE#${officeId}` },
      SK: { S: "METADATA" },
    };

    const officeResult = await dbClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: officeKey,
      })
    );

    if (!officeResult.Item) {
      throw new Error(`Office with ID "${officeId}" does not exist.`);
    }
    const { papId, name, status } = body;

    const item = {
      PK: `OFFICE#${officeId}`,
      SK: `PAP#${papId}`,
      papId: papId,
      name,
      status,
      createdAt: new Date().toISOString(),
    };

    const command = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item),
    });

    await dbClient.send(command);
    return item;
  };

  const getPAPByOffice = async (officeId: string) => {
    if (!officeId) {
      throw new Error("Missing officeId");
    }

    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: `OFFICE#${officeId}` },
        ":sk": { S: "PAP#" },
      },
    });

    const response = await dbClient.send(command);

    return response.Items?.map((item) => unmarshall(item)) ?? [];
  };

  const getPAPs = async (): Promise<PAPInput[]> => {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: "SK = :sk AND begins_with(PK, :pkPrefix)",
      ExpressionAttributeValues: {
        ":sk": { S: "METADATA" },
        ":pkPrefix": { S: "PAP#" },
      },
    });

    const response = await dbClient.send(command);
    return response.Items?.map((item) => unmarshall(item) as PAPInput) ?? [];
  };

  const getPAPByID = async (papId: string) => {
    if (!papId) {
      throw new Error("Missing papId");
    }

    const key = {
      PK: { S: `PAP#${papId}` },
      SK: { S: "METADATA" },
    };

    const command = new GetItemCommand({
      TableName: tableName,
      Key: key,
    });

    const result = await dbClient.send(command);

    if (!result.Item) return null;

    return unmarshall(result.Item);
  };
  const deletePAP = async (papId: string) => {
    try {
      if (!papId) {
        throw new Error("Missing papId");
      }

      const key = {
        PK: { S: `PAP#${papId}` },
        SK: { S: "METADATA" },
      };

      const command = new DeleteItemCommand({
        TableName: tableName,
        Key: key,
        ConditionExpression: "attribute_exists(PK)",
      });

      await dbClient.send(command);

      return { message: "PAP deleted successfully.", papId };
    } catch (error) {
      throw error;
    }
  };

  return {
    createPAP,
    getPAPs,
    getPAPsByAllotment,
    getPAP,
    deletePAP,
    attachPAPToOffice,
    getPAPByOffice,
    getPAPByID,
  };
}
