import dbClient from "../db/dbClient";
import {
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { type UACSInput } from "../types/UACS";

export const uacsService = () => {
  const tableName = process.env.DYNAMODB_TABLE_NAME!;

  const createUACS = async (papId: string, uacsData: any) => {
    const uacsItem = {
      PK: `PAP#${papId}`,
      SK: `UACS#${uacsData.code}`,
      type: "uacs",
      ...uacsData,
    };

    await dbClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall(uacsItem),
      })
    );

    return uacsItem;
  };

  const getUACS = async (papId: string, uacsCode: string) => {
    const key = {
      PK: `PAP#${papId}`,
      SK: `UACS#${uacsCode}`,
    };

    const result = await dbClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: marshall(key),
      })
    );

    if (!result.Item) return null;

    return unmarshall(result.Item);
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
    getUACS,
    getAllUACSByPAP,
    attachUACSToPAP,
    listUACSForPAP,
  };
};
