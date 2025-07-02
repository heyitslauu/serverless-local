import { v4 as uuidv4 } from "uuid";

import dbClient from "../db/dbClient";
import {
  PutItemCommand,
  ScanCommandInput,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { type Allotment } from "../types/Allotment";

export function allotmentService() {
  const createAllotment = async (body: Allotment) => {
    const { officeId, allotmentId, amount, year, ...rest } = body;

    const newAllotment = {
      PK: `OFFICE-${officeId}`,
      SK: `ALLOTMENT#${allotmentId}`,
      type: "allotment",
      amount,
      year,
      ...rest,
    };

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: marshall(newAllotment),
    };

    await dbClient.send(new PutItemCommand(params));
    return newAllotment;
  };

  const getAllotmentsByOffice = async (officeId: string) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: `OFFICE-${officeId}` },
        ":sk": { S: "ALLOTMENT#" },
      },
    };

    const result = await dbClient.send(new QueryCommand(params));
    return result.Items?.map((item) => unmarshall(item));
  };

  const getAllAllotments = async () => {
    const params: ScanCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
    };

    const { Items } = await dbClient.send(new ScanCommand(params));

    return Items?.map((item) => unmarshall(item)) || [];
  };

  return {
    createAllotment,
    getAllotmentsByOffice,
    getAllAllotments,
  };
}

// FO-Level (UACS each PAP)
// export const createUACS = async (body: {
//   officeId: string;
//   allotmentId: string;
//   papId: string;
//   categoryId: string;
//   amount: number;
//   remarks?: string;
// }) => {
//   const { officeId, allotmentId, papId, categoryId, ...rest } = body;

//   const newSubAllotment = {
//     PK: `OFFICE-${officeId}`,
//     SK: `ALLOTMENT#${allotmentId}#PAP#${papId}#CATEGORY#${categoryId}`,
//     type: "sub-allotment",
//     ...rest,
//   };

//   const params = {
//     TableName: process.env.DYNAMODB_TABLE_NAME!,
//     Item: marshall(newSubAllotment),
//   };

//   await dbClient.send(new PutItemCommand(params));
//   return newSubAllotment;
// };
