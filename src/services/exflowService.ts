import { v4 as uuidv4 } from "uuid";

import { type ExFlow } from "../types/ExFlow";
import dbClient from "../db/dbClient";
import {
  QueryCommand,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export function exflowService() {
  const addOfficial = async ({
    allotmentId,
    exflow,
  }: {
    allotmentId: string;
    exflow: ExFlow[];
  }) => {
    const tableName = process.env.DYNAMODB_TABLE_NAME!;

    const pk = `ALLOTMENT#${allotmentId.toUpperCase()}`;
    const sk = "METADATA";

    // 1. Fetch the existing item
    const { Item } = await dbClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: marshall({ PK: pk, SK: sk }),
      })
    );

    if (!Item) {
      throw new Error("Allotment not found");
    }

    const unmarshalled = unmarshall(Item);
    const existingExflow = unmarshalled.exflow || [];

    // 2. Append new exflow items
    const updatedExflow = [
      ...existingExflow,
      ...exflow.map((item) => ({
        ...item,
        exflowId: uuidv4(),
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })),
    ];

    // 3. Update the database with the new exflow array
    await dbClient.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: marshall({ PK: pk, SK: sk }),
        UpdateExpression: "SET exflow = :updatedExflow",
        ExpressionAttributeValues: marshall({
          ":updatedExflow": updatedExflow,
        }),
      })
    );

    return updatedExflow;
  };

  const updateExflowItem = async ({
    allotmentId,
    exflowId,
    status,
    remarks,
  }: {
    allotmentId: string;
    exflowId: string;
    status: string;
    remarks?: string;
  }) => {
    const tableName = process.env.DYNAMODB_TABLE_NAME!;

    // 1. Fetch the item
    const { Item } = await dbClient.send(
      new GetItemCommand({
        TableName: tableName,
        Key: marshall({
          PK: `ALLOTMENT#${allotmentId}`,
          SK: "METADATA",
        }),
      })
    );

    if (!Item) throw new Error("Allotment not found");
    const unmarshalled = unmarshall(Item);
    const exflow = unmarshalled.exflow || [];

    // 2. Update specific item
    const updatedExflow = exflow.map((item: any) =>
      item.id === exflowId || item.exflowId === exflowId
        ? {
            ...item,
            status,
            remarks: remarks ?? item.remarks,
            date: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    // 3. Put back the whole exflow
    await dbClient.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: marshall({
          PK: `ALLOTMENT#${allotmentId}`,
          SK: "METADATA",
        }),
        UpdateExpression: "SET exflow = :updatedExflow",
        ExpressionAttributeValues: marshall({
          ":updatedExflow": updatedExflow,
        }),
      })
    );

    return updatedExflow.find((e: any) => e.exflowId === exflowId);
  };
  return {
    addOfficial,
    updateExflowItem,
  };
}
