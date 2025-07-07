import dbClient from "../db/dbClient";
import {
  QueryCommandOutput,
  ScanCommandOutput,
  ScanCommand,
  BatchWriteItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";

import {
  type AllotmentFilters,
  type AllotmentBreakdown,
} from "../types/Allotment";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { type Allotment } from "../types/Allotment";

export function allotmentService() {
  const downloadAllotment = async (body: Allotment) => {
    const tableName = process.env.DYNAMODB_TABLE_NAME!;

    const {
      officeId,
      allotmentId,
      particulars,
      appropriationType,
      bfarsBudgetType,
      allotmentType,
      breakdown,
    } = body;

    const timestamp = new Date().toISOString();
    const items = [];

    for (const entry of breakdown) {
      const { fieldOfficeId, papId, uacsId, amount: entryAmount } = entry;

      items.push({
        PutRequest: {
          Item: {
            PK: { S: `OFFICE#${fieldOfficeId}` },
            SK: { S: `ALLOTMENT#${allotmentId}#PAP#${papId}#UACS#${uacsId}` },
            allotmentId: { S: allotmentId.toUpperCase() },
            officeFrom: { S: officeId },
            fieldOfficeId: { S: fieldOfficeId },
            papId: { S: papId },
            uacsId: { S: uacsId },
            amount: { N: entryAmount.toString() },
            particulars: { S: particulars.toUpperCase() },
            appropriationType: { S: appropriationType.toUpperCase() },
            bfarsBudgetType: { S: bfarsBudgetType.toUpperCase() },
            allotmentType: { S: allotmentType.toUpperCase() },
            createdAt: { S: timestamp },
            status: { S: "FOR-TRIAGE" },
          },
        },
      });
    }

    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      const command = new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: batch,
        },
      });
      await dbClient.send(command);
    }

    return {
      allotmentId,
      recordsCreated: breakdown.length,
      totalAlloted: breakdown.reduce((sum, b) => sum + b.amount, 0),
      papBreakdown: breakdown.reduce((acc, curr) => {
        const { fieldOfficeId, papId, uacsId, amount } = curr;

        const existing = acc.find(
          (item) => item.fieldOfficeId === fieldOfficeId
        );
        const entry = { papId, uacsId, amount };

        if (existing) {
          existing.entries.push(entry);
        } else {
          acc.push({
            fieldOfficeId,
            entries: [entry],
          });
        }

        return acc;
      }, [] as { fieldOfficeId: string; entries: { papId: string; uacsId: string; amount: number }[] }[]),
    };
  };

  const getAllotmentByOffice = async (officeId: string) => {
    const params: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: `OFFICE#${officeId}` },
      },
    };

    const result = await dbClient.send(new QueryCommand(params));

    const items = result.Items?.map((item) => unmarshall(item)) ?? [];

    const totalAlloted = items.reduce((sum, item) => {
      const value = Number(item.amount);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    return {
      items,
      totalAlloted,
    };
  };

  const filterAllotments = async (filters: AllotmentFilters = {}) => {
    const { status, createdAtRange, papId, allotmentId, search } = filters;

    let command;

    if (status && createdAtRange) {
      command = new QueryCommand({
        TableName: "EmpowerexFinance",
        IndexName: "StatusCreatedAtIndex",
        KeyConditionExpression:
          "#status = :status AND #createdAt BETWEEN :from AND :to",
        ExpressionAttributeNames: {
          "#status": "status",
          "#createdAt": "createdAt",
        },
        ExpressionAttributeValues: {
          ":status": { S: status.toUpperCase() },
          ":from": { S: createdAtRange.from },
          ":to": { S: createdAtRange.to },
        },
      });
    } else if (status) {
      command = new QueryCommand({
        TableName: "EmpowerexFinance",
        IndexName: "StatusIndex",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": { S: status.toUpperCase() } },
      });
    } else if (papId) {
      command = new QueryCommand({
        TableName: "EmpowerexFinance",
        IndexName: "PapIdIndex",
        KeyConditionExpression: "#papId = :papId",
        ExpressionAttributeNames: { "#papId": "papId" },
        ExpressionAttributeValues: { ":papId": { S: papId.toUpperCase() } },
      });
    } else if (allotmentId) {
      command = new QueryCommand({
        TableName: "EmpowerexFinance",
        IndexName: "AllotmentIdIndex",
        KeyConditionExpression: "#allotmentId = :allotmentId",
        ExpressionAttributeNames: { "#allotmentId": "allotmentId" },
        ExpressionAttributeValues: { ":allotmentId": { S: allotmentId } },
      });
    } else if (search) {
      // ✅ Search using contains() on both fields — fallback to Scan
      command = new ScanCommand({
        TableName: "EmpowerexFinance",
        FilterExpression:
          "contains(allotmentId, :search) OR contains(particulars, :search)",
        ExpressionAttributeValues: {
          ":search": { S: search.toUpperCase() },
        },
      });
    } else {
      // ⚠️ No filter provided — fallback to full scan
      command = new ScanCommand({ TableName: "EmpowerexFinance" });
    }

    const response = (await dbClient.send(command)) as
      | QueryCommandOutput
      | ScanCommandOutput;

    const items = (response.Items ?? []).map((item) => unmarshall(item));
    return items;
  };

  const getAllotmentById = async (allotmentId: string) => {
    const command = new QueryCommand({
      TableName: "EmpowerexFinance",
      IndexName: "AllotmentIdIndex",
      KeyConditionExpression: "#allotmentId = :allotmentId",
      ExpressionAttributeNames: {
        "#allotmentId": "allotmentId",
      },
      ExpressionAttributeValues: {
        ":allotmentId": { S: allotmentId },
      },
    });

    const result = await dbClient.send(command);
    const items = result.Items?.map((item) => unmarshall(item)) ?? [];

    const totalAlloted = items.reduce((sum, item) => {
      const value = Number(item.amount);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    return {
      items,
      totalAlloted,
    };
  };

  const patchBreakdown = async (body: {
    officeId: string;
    allotmentId: string;
    breakdown: {
      fieldOfficeId: string;
      papId: string;
      uacsId: string;
      amount: number;
    }[];
  }) => {
    const { officeId, allotmentId, breakdown } = body;

    const tableName = process.env.DYNAMODB_TABLE_NAME!;
    const timestamp = new Date().toISOString();
    const items = [];

    for (const entry of breakdown) {
      const { fieldOfficeId, papId, uacsId, amount } = entry;

      items.push({
        PutRequest: {
          Item: {
            PK: { S: `OFFICE#${fieldOfficeId}` },
            SK: { S: `ALLOTMENT#${allotmentId}#PAP#${papId}#UACS#${uacsId}` },
            allotmentId: { S: allotmentId.toUpperCase() },
            officeFrom: { S: officeId },
            fieldOfficeId: { S: fieldOfficeId },
            papId: { S: papId },
            uacsId: { S: uacsId },
            amount: { N: amount.toString() },
            createdAt: { S: timestamp },
            status: { S: "FOR-TRIAGE" },
          },
        },
      });
    }

    // Batch write in chunks of 25
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      const command = new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: batch,
        },
      });
      await dbClient.send(command);
    }

    return {
      allotmentId,
      recordsAdded: breakdown.length,
      totalAdded: breakdown.reduce((sum, b) => sum + b.amount, 0),
    };
  };

  return {
    getAllotmentByOffice,
    downloadAllotment,
    filterAllotments,
    getAllotmentById,
    patchBreakdown,
  };
}
