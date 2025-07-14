import dbClient from "../db/dbClient";
import {
  PutItemCommand,
  ScanCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { type Office } from "../types/Office";

export function officeService() {
  const tableName = process.env.DYNAMODB_TABLE_NAME!;

  const createOffice = async (body: Office) => {
    const { officeId, name, location, region } = body;

    const timestamp = new Date().toISOString();

    const item = {
      PK: `OFFICE#${officeId}`,
      SK: `METADATA`,
      officeId,
      name,
      location,
      createdAt: timestamp,
      ...(region && { region }),
    };

    const command = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item),
      ConditionExpression: "attribute_not_exists(PK)",
    });

    try {
      await dbClient.send(command);
      return item;
    } catch (error) {
      if (error.name === "ConditionalCheckFailedException") {
        return {
          statusCode: 422,
          message: "Office already exists.",
        };
      }

      return {
        message: "Unexpected error occurred while creating office.",
        error: true,
      };
    }
  };

  const getOffices = async (): Promise<Office[]> => {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: "begins_with(PK, :pkPrefix) AND SK = :sk",
      ExpressionAttributeValues: {
        ":pkPrefix": { S: "OFFICE#" },
        ":sk": { S: "METADATA" },
      },
    });

    try {
      const response = await dbClient.send(command);
      return response.Items?.map((item) => unmarshall(item) as Office) ?? [];
    } catch (error) {
      throw error;
    }
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

  const patchOffice = async (officeId: string, updates: Partial<Office>) => {
    const { name, location, region } = updates;

    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (name !== undefined) {
      updateExpressions.push("#name = :name");
      expressionAttributeValues[":name"] = { S: name };
      expressionAttributeNames["#name"] = "name";
    }

    if (location !== undefined) {
      updateExpressions.push("#location = :location");
      expressionAttributeValues[":location"] = { S: location };
      expressionAttributeNames["#location"] = "location";
    }

    if (region !== undefined) {
      updateExpressions.push("#region = :region");
      expressionAttributeValues[":region"] = { S: region };
      expressionAttributeNames["#region"] = "region";
    }

    if (updateExpressions.length === 0) {
      return {
        message: "No fields to update.",
        officeId,
        error: true,
      };
    }

    const command = new UpdateItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: `OFFICE#${officeId}` },
        SK: { S: "METADATA" },
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ConditionExpression: "attribute_exists(PK)",
      ReturnValues: "UPDATED_NEW",
    });

    try {
      const response = await dbClient.send(command);
      return {
        message: "Office updated successfully.",
        officeId,
        updatedFields: response.Attributes,
      };
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        return {
          statusCode: 422,
          message: "Office does not exist.",
        };
      }

      return {
        message: "Unexpected error occurred while updating office.",
        error: true,
      };
    }
  };

  const deleteOffice = async (officeId: string) => {
    const getCommand = new GetItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: `OFFICE#${officeId}` },
        SK: { S: "METADATA" },
      },
    });

    try {
      const response = await dbClient.send(getCommand);
      if (!response.Item) {
        return {
          statusCode: 422,
          message: "Office does not exist.",
        };
      }

      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          PK: { S: `OFFICE#${officeId}` },
          SK: { S: "METADATA" },
        },
      });

      await dbClient.send(deleteCommand);
      return {
        message: "Office deleted successfully.",
        officeId,
      };
    } catch (error) {
      return {
        message: "Unexpected error occurred while deleting office.",
        error: true,
      };
    }
  };

  return {
    createOffice,
    getOffices,
    getOfficeById,
    patchOffice,
    deleteOffice,
  };
}
