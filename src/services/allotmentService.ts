import dbClient from "../db/dbClient";
import {
  QueryCommandOutput,
  ScanCommandOutput,
  ScanCommand,
  BatchGetItemCommand,
  BatchWriteItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";

import { type AllotmentFilters, AllotmentItem } from "../types/Allotment";

import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { type Allotment, type AllotmentBreakdown } from "../types/Allotment";

const checkOfficeAndPAPExist = async (
  breakdown: Allotment["breakdown"]
): Promise<string[]> => {
  const tableName = process.env.DYNAMODB_TABLE_NAME!;
  const keysToCheck: { compoundKey: string; PK: string; SK: string }[] = [];

  const seen = new Set<string>();

  for (const { fieldOfficeId, papId } of breakdown) {
    const officeKey = `OFFICE#${fieldOfficeId}::METADATA`;
    if (!seen.has(officeKey)) {
      keysToCheck.push({
        compoundKey: officeKey,
        PK: `OFFICE#${fieldOfficeId}`,
        SK: `METADATA`,
      });
      seen.add(officeKey);
    }

    const papKey = `OFFICE#${fieldOfficeId}::PAP#${papId}`;
    if (!seen.has(papKey)) {
      keysToCheck.push({
        compoundKey: papKey,
        PK: `OFFICE#${fieldOfficeId}`,
        SK: `PAP#${papId}`,
      });
      seen.add(papKey);
    }
  }

  const errors: string[] = [];

  // Batch in chunks of 100
  for (let i = 0; i < keysToCheck.length; i += 100) {
    const batch = keysToCheck.slice(i, i + 100);

    const command = new BatchGetItemCommand({
      RequestItems: {
        [tableName]: {
          Keys: batch.map(({ PK, SK }) => marshall({ PK, SK })),
        },
      },
    });

    const response = await dbClient.send(command);
    const found = new Set(
      (response.Responses?.[tableName] ?? []).map((item) => {
        const { PK, SK } = unmarshall(item);
        return `${PK}::${SK}`;
      })
    );

    for (const { compoundKey } of batch) {
      if (!found.has(compoundKey)) {
        const [pk, sk] = compoundKey.split("::");
        if (sk === "METADATA") {
          errors.push(`Office '${pk.replace("OFFICE#", "")}' not found.`);
        } else if (sk.startsWith("PAP#")) {
          errors.push(
            `PAP '${sk.replace("PAP#", "")}' not found for office '${pk.replace(
              "OFFICE#",
              ""
            )}'.`
          );
        } else {
          errors.push(`Record '${compoundKey}' not found.`);
        }
      }
    }
  }

  return errors;
};

export function allotmentService() {
  const createAllotmentItem = async (body: AllotmentItem) => {
    const tableName = process.env.DYNAMODB_TABLE_NAME!;
    const {
      allotmentId,
      date,
      particulars,
      appropriationType,
      bfarsBudgetType,
      allotmentType,
      totalAllotment,
    } = body;

    const upperAllotmentId = allotmentId.toUpperCase();

    const itemObj = {
      PK: `ALLOTMENT#${upperAllotmentId}`,
      SK: `METADATA`,
      allotmentId: upperAllotmentId,
      date,
      particulars: particulars.toUpperCase(),
      appropriationType: appropriationType.toUpperCase(),
      bfarsBudgetType: bfarsBudgetType.toUpperCase(),
      allotmentType: allotmentType.toUpperCase(),
      createdAt: new Date().toISOString(),
      totalAllotment: totalAllotment * 100,
      status: "FOR-TRIAGE",
    };

    const item = marshall(itemObj);

    await dbClient.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: [
            {
              PutRequest: {
                Item: item,
              },
            },
          ],
        },
      })
    );

    return { ...itemObj, totalAllotment: itemObj.totalAllotment / 100 };
  };

  const postAllotmentBreakdown = async ({
    allotmentId,
    objectExpenditures,
  }: {
    allotmentId: string;
    objectExpenditures: AllotmentBreakdown[];
  }) => {
    const tableName = process.env.DYNAMODB_TABLE_NAME!;
    const upperAllotmentId = allotmentId.toUpperCase();
    const timestamp = new Date().toISOString();

    const batchWriteItems = objectExpenditures.map(
      ({ fieldOfficeId, papId, uacsId, amount }) => ({
        PutRequest: {
          Item: marshall({
            PK: `OFFICE#${fieldOfficeId}`,
            SK: `ALLOTMENT#${upperAllotmentId}#PAP#${papId}#UACS#${uacsId}`,
            allotmentId: upperAllotmentId,
            fieldOfficeId,
            papId,
            uacsId,
            amount: amount * 100,
            createdAt: timestamp,
            status: "FOR-TRIAGE",
          }),
        },
      })
    );

    for (let i = 0; i < batchWriteItems.length; i += 25) {
      await dbClient.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [tableName]: batchWriteItems.slice(i, i + 25),
          },
        })
      );
    }

    return {
      allotmentId: upperAllotmentId,
      data: objectExpenditures,
      totalAlloted: objectExpenditures.reduce((sum, b) => sum + b.amount, 0),
    };
  };

  const createAllotment = async (body: Allotment) => {
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

    const errors = await checkOfficeAndPAPExist(breakdown);

    if (errors.length > 0) {
      return {
        statusCode: 422,
        message: "Validation Error",
        errors: errors,
      };
    }

    const timestamp = new Date().toISOString();
    const upperAllotmentId = allotmentId.toUpperCase();

    const batchWriteItems = breakdown.map(
      ({ fieldOfficeId, papId, uacsId, amount }) => ({
        PutRequest: {
          Item: marshall({
            PK: `OFFICE#${fieldOfficeId}`,
            SK: `ALLOTMENT#${upperAllotmentId}#PAP#${papId}#UACS#${uacsId}`,
            allotmentId: upperAllotmentId,
            officeFrom: officeId,
            fieldOfficeId,
            papId,
            uacsId,
            amount: amount * 100,
            particulars: particulars.toUpperCase(),
            appropriationType: appropriationType.toUpperCase(),
            bfarsBudgetType: bfarsBudgetType.toUpperCase(),
            allotmentType: allotmentType.toUpperCase(),
            createdAt: timestamp,
            status: "FOR-TRIAGE",
          }),
        },
      })
    );

    for (let i = 0; i < batchWriteItems.length; i += 25) {
      await dbClient.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [tableName]: batchWriteItems.slice(i, i + 25),
          },
        })
      );
    }

    const papBreakdown = breakdown.reduce(
      (acc, { fieldOfficeId, papId, uacsId, amount }) => {
        let officeEntry = acc.find((e) => e.fieldOfficeId === fieldOfficeId);
        if (!officeEntry) {
          officeEntry = { fieldOfficeId, entries: [] };
          acc.push(officeEntry);
        }
        officeEntry.entries.push({ papId, uacsId, amount });
        return acc;
      },
      [] as {
        fieldOfficeId: string;
        entries: { papId: string; uacsId: string; amount: number }[];
      }[]
    );

    return {
      allotmentId: upperAllotmentId,
      data: breakdown.length,
      totalAlloted: breakdown.reduce((sum, b) => sum + b.amount, 0),
      papBreakdown,
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
    const tableName = process.env.DYNAMODB_TABLE_NAME!;
    let command;

    if (status && createdAtRange) {
      command = new QueryCommand({
        TableName: tableName,
        IndexName: "MetadataIndex",
        KeyConditionExpression:
          "#sk = :sk AND #createdAt BETWEEN :from AND :to",
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: {
          "#sk": "SK",
          "#createdAt": "createdAt",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":sk": { S: "METADATA" },
          ":from": { S: createdAtRange.from },
          ":to": { S: createdAtRange.to },
          ":status": { S: status.toUpperCase() },
        },
      });
    } else if (status) {
      command = new QueryCommand({
        TableName: tableName,
        IndexName: "MetadataIndex",
        KeyConditionExpression: "#sk = :sk",
        FilterExpression: "begins_with(#pk, :pkPrefix) AND #status = :status",
        ExpressionAttributeNames: {
          "#sk": "SK",
          "#pk": "PK",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":sk": { S: "METADATA" },
          ":pkPrefix": { S: "ALLOTMENT#" },
          ":status": { S: status.toUpperCase() },
        },
      });
    } else if (papId) {
      command = new QueryCommand({
        TableName: tableName,
        IndexName: "PapIdIndex",
        KeyConditionExpression: "#papId = :papId",
        ExpressionAttributeNames: { "#papId": "papId" },
        ExpressionAttributeValues: { ":papId": { S: papId.toUpperCase() } },
      });
    } else if (allotmentId) {
      command = new QueryCommand({
        TableName: tableName,
        IndexName: "AllotmentIdIndex",
        KeyConditionExpression: "#allotmentId = :allotmentId",
        ExpressionAttributeNames: { "#allotmentId": "allotmentId" },
        ExpressionAttributeValues: { ":allotmentId": { S: allotmentId } },
      });
    } else if (search) {
      command = new ScanCommand({
        TableName: tableName,
        FilterExpression:
          "contains(allotmentId, :search) OR contains(particulars, :search)",
        ExpressionAttributeValues: {
          ":search": { S: search.toUpperCase() },
        },
      });
    } else {
      command = new QueryCommand({
        TableName: tableName,
        IndexName: "MetadataIndex",
        KeyConditionExpression: "#sk = :sk",
        FilterExpression: "begins_with(#pk, :pkPrefix)",
        ExpressionAttributeNames: {
          "#sk": "SK",
          "#pk": "PK",
        },
        ExpressionAttributeValues: {
          ":sk": { S: "METADATA" },
          ":pkPrefix": { S: "ALLOTMENT#" },
        },
      });
    }

    const response = (await dbClient.send(command)) as
      | QueryCommandOutput
      | ScanCommandOutput;

    const items = (response.Items ?? []).map((item) => unmarshall(item));
    return items;
  };

  const getAllotmentById = async (allotmentId: string) => {
    const tableName = process.env.DYNAMODB_TABLE_NAME!;

    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "AllotmentIdIndex",
      KeyConditionExpression: "#allotmentId = :allotmentId",
      ExpressionAttributeNames: {
        "#allotmentId": "allotmentId",
      },
      ExpressionAttributeValues: {
        ":allotmentId": { S: allotmentId },
      },
    });

    try {
      const result = await dbClient.send(command);
      const rawItems = result.Items ?? [];

      const items = rawItems.map((item) => {
        const unmarshalled = unmarshall(item);
        return {
          ...unmarshalled,
          amount: unmarshalled.amount ? unmarshalled.amount / 100 : 0,
        };
      });

      const totalAlloted = items.reduce((sum, item) => {
        const value = Number(item.amount);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);

      return {
        items,
        totalAlloted,
      };
    } catch (error) {
      console.error("Error fetching allotments:", error);
      return {
        message: "Failed to retrieve allotments.",
        error: (error as Error).message || "Unknown error",
      };
    }
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
            amount: { N: (amount * 100).toString() },
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
    createAllotment,
    filterAllotments,
    getAllotmentById,
    patchBreakdown,
    createAllotmentItem,
    postAllotmentBreakdown,
  };
}
