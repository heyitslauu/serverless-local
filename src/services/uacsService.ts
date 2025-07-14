import dbClient from "../db/dbClient";
import {
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { type UACSInput } from "../types/UACS";

export const uacsService = () => {
  const tableName = process.env.DYNAMODB_TABLE_NAME!;

  const createUACS = async (body: UACSInput) => {
    if (!body) {
      throw new Error("Missing request body.");
    }

    const { uacsId, name } = body;
    const timestamp = new Date().toISOString();

    const item = {
      PK: `UACS#${uacsId}`,
      SK: "METADATA",
      uacsId,
      name,
      createdAt: timestamp,
    };

    const params = {
      TableName: tableName,
      Item: marshall(item),
      ConditionExpression: "attribute_not_exists(PK)",
    };

    try {
      await dbClient.send(new PutItemCommand(params));
      return item;
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        return {
          statusCode: 422,
          message: "UACS already exists.",
        };
      }
      throw error;
    }
  };

  const getAllUACS = async (): Promise<UACSInput[]> => {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: "begins_with(PK, :pkPrefix) AND SK = :sk",
      ExpressionAttributeValues: {
        ":pkPrefix": { S: "UACS#" },
        ":sk": { S: "METADATA" },
      },
    });

    try {
      const response = await dbClient.send(command);
      return response.Items?.map((item) => unmarshall(item) as UACSInput) ?? [];
    } catch (error) {
      throw error;
    }
  };

  const getUACSById = async (uacsId: string): Promise<UACSInput | null> => {
    const command = new GetItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: `UACS#${uacsId}` },
        SK: { S: "METADATA" },
      },
    });

    const response = await dbClient.send(command);
    return response.Item ? (unmarshall(response.Item) as UACSInput) : null;
  };

  const deleteUACS = async (uacsId: string) => {
    const params = {
      TableName: tableName,
      Key: {
        PK: { S: `UACS#${uacsId}` },
        SK: { S: "METADATA" },
      },
    };

    try {
      await dbClient.send(new DeleteItemCommand(params));
      return { message: "UACS deleted successfully." };
    } catch (error) {
      throw error;
    }
  };

  const getAllUACSByPAP = async (papId: string) => {
    const params = {
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: `PAP#${papId}` },
        ":sk": { S: "UACS#" },
      },
    };

    const result = await dbClient.send(new QueryCommand(params));
    return result.Items?.map((item) => unmarshall(item)) ?? [];
  };

  const attachUACSToPAP = async (
    officeId: string,
    papId: string,
    body: UACSInput
  ) => {
    if (!body) {
      throw new Error("Missing request body.");
    }

    const timestamp = new Date().toISOString();
    const { uacsId, amount, name } = body;

    const item = {
      PK: `OFFICE#${officeId}`,
      SK: `PAP#${papId}#UACS#${uacsId}`,
      officeId,
      papId,
      uacsId,
      name,
      amount: amount * 100,
      createdAt: timestamp,
      status: "ACTIVE",
    };
    const command = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item),
    });

    await dbClient.send(command);
    return item;
  };

  const listUACSForPAP = async (officeId: string, papId: string) => {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": { S: `OFFICE#${officeId}` },
        ":skPrefix": { S: `PAP#${papId}#UACS#` },
      },
    });

    const response = await dbClient.send(command);

    const items =
      response.Items?.map((item) => {
        const unmarshalled = unmarshall(item);
        return {
          ...unmarshalled,
          amount: unmarshalled.amount / 100,
        };
      }) || [];

    return items;
  };

  return {
    createUACS,
    getAllUACS,
    getAllUACSByPAP,
    attachUACSToPAP,
    listUACSForPAP,
    getUACSById,
    deleteUACS,
  };
};
