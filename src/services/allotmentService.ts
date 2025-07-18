import { v4 as uuidv4 } from "uuid";

import dbClient from "../db/dbClient";
import {
  QueryCommandOutput,
  ScanCommandOutput,
  ScanCommand,
  BatchGetItemCommand,
  BatchWriteItemCommand,
  QueryCommand,
  QueryCommandInput,
  ScanCommandInput,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";

import {
  type AllotmentFilters,
  AllotmentItem,
  AllotmentRecord,
} from "../types/Allotment";

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
      exFlow: [],
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
      exFlow: [],
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
    const uniqueId = uuidv4();
    const tableName = process.env.DYNAMODB_TABLE_NAME!;
    const upperAllotmentId = allotmentId.toUpperCase();
    const timestamp = new Date().toISOString();

    const batchWriteItems = objectExpenditures.map(
      ({ fieldOfficeId, papId, uacsId, amount }) => ({
        PutRequest: {
          Item: marshall({
            PK: `OFFICE#${fieldOfficeId}`,
            SK: `ALLOTMENT#${upperAllotmentId}#PAP#${papId}#UACS#${uacsId}#${uniqueId}`,
            parentSK: `ALLOTMENT#${upperAllotmentId}#PAP#${papId}#UACS#${uacsId}`,
            allotmentId: upperAllotmentId,
            fieldOfficeId,
            papId,
            uacsId,
            amount: amount * 100,
            createdAt: timestamp,
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

    const formattedExpenditures = objectExpenditures.map(
      ({ fieldOfficeId, papId, uacsId, amount }) => ({
        PK: `OFFICE#${fieldOfficeId}`,
        SK: `ALLOTMENT#${upperAllotmentId}#PAP#${papId}#UACS#${uacsId}#${uniqueId}`,
        parentSK: `ALLOTMENT#${upperAllotmentId}#PAP#${papId}#UACS#${uacsId}`,
        allotmentId: upperAllotmentId,
        fieldOfficeId,
        papId,
        uacsId,
        amount,
        createdAt: timestamp,
      })
    );

    return {
      allotmentId: upperAllotmentId,
      data: formattedExpenditures,
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
    const {
      status,
      createdAtRange,
      papId,
      allotmentId,
      search,
      lastEvaluatedKey,
    } = filters;

    const tableName = process.env.DYNAMODB_TABLE_NAME!;

    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, any> = {};

    const scanParams: ScanCommandInput = {
      TableName: tableName,
      ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
    };

    const filterExpressions: string[] = [];

    if (status) {
      filterExpressions.push("#status = :status");
      attributeNames["#status"] = "status";
      attributeValues[":status"] = { S: status.toUpperCase() };
    }

    if (createdAtRange?.from && createdAtRange?.to) {
      filterExpressions.push("#createdAt BETWEEN :from AND :to");
      attributeNames["#createdAt"] = "createdAt";
      attributeValues[":from"] = { S: createdAtRange.from };
      attributeValues[":to"] = { S: createdAtRange.to };
    }

    if (papId) {
      filterExpressions.push("#papId = :papId");
      attributeNames["#papId"] = "papId";
      attributeValues[":papId"] = { S: papId.toUpperCase() };
    }

    if (allotmentId) {
      filterExpressions.push("#allotmentId = :allotmentId");
      attributeNames["#allotmentId"] = "allotmentId";
      attributeValues[":allotmentId"] = { S: allotmentId };
    }

    if (search) {
      filterExpressions.push(
        "contains(allotmentId, :search) OR contains(particulars, :search)"
      );
      attributeValues[":search"] = { S: search.toUpperCase() };
    }

    // Combine filter expressions
    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(" AND ");
      scanParams.ExpressionAttributeValues = attributeValues;

      if (Object.keys(attributeNames).length > 0) {
        scanParams.ExpressionAttributeNames = attributeNames;
      }

      const response = await dbClient.send(new ScanCommand(scanParams));

      const items = (response.Items ?? [])
        .map((item) => unmarshall(item))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      return {
        items,
        lastEvaluatedKey: response.LastEvaluatedKey
          ? unmarshall(response.LastEvaluatedKey)
          : null,
        totalCount: items.length,
      };
    } else {
      const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: "begins_with(#pk, :pkPrefix)",
        ExpressionAttributeNames: {
          "#pk": "PK",
        },
        ExpressionAttributeValues: {
          ":pkPrefix": { S: "ALLOTMENT#" },
        },
        ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
      });

      const response = await dbClient.send(command);

      const items = (response.Items ?? [])
        .map((item) => unmarshall(item))
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      return {
        items,
        lastEvaluatedKey: response.LastEvaluatedKey
          ? unmarshall(response.LastEvaluatedKey)
          : null,
        totalCount: items.length,
      };
    }
  };

  const updateAllotmentStatus = async (
    allotmentId: string,
    body: {
      status:
        | "for-triage"
        | "for-processing"
        | "for-peer-review"
        | "for-approval"
        | "approved"
        | "rejected";
      remarks?: string;
    }
  ) => {
    const tableName = process.env.DYNAMODB_TABLE_NAME!;
    const { status, remarks } = body;

    const upperStatus = status.toUpperCase();
    const updateExpressions: string[] = ["#status = :status"];
    const expressionAttributeNames: Record<string, string> = {
      "#status": "status",
    };
    const expressionAttributeValues: Record<string, any> = {
      ":status": upperStatus,
    };

    if (remarks) {
      updateExpressions.push("#remarks = :remarks");
      expressionAttributeNames["#remarks"] = "remarks";
      expressionAttributeValues[":remarks"] = remarks;
    }

    const updateExpression = `SET ${updateExpressions.join(", ")}`;

    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": { S: `ALLOTMENT#${allotmentId.toUpperCase()}` },
        ":sk": { S: "METADATA" },
      },
    });

    const result = await dbClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      throw new Error(`Allotment with ID '${allotmentId}' not found.`);
    }

    const updateCommand = new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: [
          {
            PutRequest: {
              Item: marshall({
                ...unmarshall(result.Items[0]),
                status: upperStatus,
                ...(remarks && { remarks }),
                updatedAt: new Date().toISOString(),
              }),
            },
          },
        ],
      },
    });

    await dbClient.send(updateCommand);

    return {
      allotmentId,
      status: upperStatus,
      ...(remarks && { remarks }),
    };
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

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const rawItems = result.Items;

      const items = rawItems.map((item) => unmarshall(item));

      const parent = items.find((item) => item.SK === "METADATA");
      const breakdowns: Partial<AllotmentRecord>[] = items
        .filter((item) => item.SK !== "METADATA")
        .map((item) => ({
          ...item,
          amount: Number(item.amount) / 100,
        }));

      const sortedBreakdowns = breakdowns.sort((a, b) => {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      const totalAlloted = breakdowns.reduce((sum, item) => {
        return sum + (isNaN(item.amount) ? 0 : item.amount);
      }, 0);

      if (parent?.exFlow) {
        parent.exFlow = parent.exFlow.sort(
          (a: { createdAt: string }, b: { createdAt: string }) => {
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          }
        );
      }

      return {
        ...parent,
        totalAllotment: parent.totalAllotment / 100,
        breakdowns: sortedBreakdowns,
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

  const deleteAllotmentBreakdown = async (pk: string, sk: string) => {
    const tableName = process.env.DYNAMODB_TABLE_NAME!;

    const command = new DeleteItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: pk },
        SK: { S: sk },
      },
    });

    try {
      await dbClient.send(command);
      return { message: "Breakdown successfully deleted." };
    } catch (error) {
      console.error("Error deleting breakdown:", error);
      return {
        message: "Failed to delete breakdown.",
        error: (error as Error).message || "Unknown error",
      };
    }
  };

  const patchDetails = async (id: string, body: Partial<AllotmentItem>) => {
    const tableName = process.env.DYNAMODB_TABLE_NAME!;
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (body.date) {
      updateExpressions.push("#date = :date");
      expressionAttributeNames["#date"] = "date";
      expressionAttributeValues[":date"] = body.date;
    }

    if (body.particulars) {
      updateExpressions.push("#particulars = :particulars");
      expressionAttributeNames["#particulars"] = "particulars";
      expressionAttributeValues[":particulars"] =
        body.particulars.toUpperCase();
    }

    if (body.appropriationType) {
      updateExpressions.push("#appropriationType = :appropriationType");
      expressionAttributeNames["#appropriationType"] = "appropriationType";
      expressionAttributeValues[":appropriationType"] =
        body.appropriationType.toUpperCase();
    }

    if (body.bfarsBudgetType) {
      updateExpressions.push("#bfarsBudgetType = :bfarsBudgetType");
      expressionAttributeNames["#bfarsBudgetType"] = "bfarsBudgetType";
      expressionAttributeValues[":bfarsBudgetType"] =
        body.bfarsBudgetType.toUpperCase();
    }

    if (body.allotmentType) {
      updateExpressions.push("#allotmentType = :allotmentType");
      expressionAttributeNames["#allotmentType"] = "allotmentType";
      expressionAttributeValues[":allotmentType"] =
        body.allotmentType.toUpperCase();
    }

    if (body.totalAllotment !== undefined) {
      updateExpressions.push("#totalAllotment = :totalAllotment");
      expressionAttributeNames["#totalAllotment"] = "totalAllotment";
      expressionAttributeValues[":totalAllotment"] = body.totalAllotment * 100;
    }

    if (updateExpressions.length === 0) {
      throw new Error("No valid fields provided for update.");
    }

    const updateExpression = `SET ${updateExpressions.join(", ")}`;

    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": { S: `ALLOTMENT#${id.toUpperCase()}` },
        ":sk": { S: "METADATA" },
      },
    });

    const result = await dbClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      throw new Error(`Allotment with ID '${id}' not found.`);
    }

    const updateCommand = new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: [
          {
            PutRequest: {
              Item: marshall({
                ...unmarshall(result.Items[0]),
                ...body,
                totalAllotment: body.totalAllotment
                  ? body.totalAllotment * 100
                  : undefined,
                updatedAt: new Date().toISOString(),
              }),
            },
          },
        ],
      },
    });

    await dbClient.send(updateCommand);

    return {
      ...unmarshall(result.Items[0]),
      ...body,
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
    patchDetails,
    updateAllotmentStatus,
    deleteAllotmentBreakdown,
  };
}
