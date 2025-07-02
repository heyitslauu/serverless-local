import dbClient from "../db/dbClient";
import {
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

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

  return {
    createUACS,
    getUACS,
    getAllUACSByPAP,
  };
};
