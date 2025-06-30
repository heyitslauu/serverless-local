import { v4 as uuidv4 } from "uuid";

import dbClient from "./src/db/dbClient";
import {
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  GetItemCommandInput,
  PutItemCommandInput,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

interface Post {
  postId: string;
  [key: string]: any;
}

export const getPost = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const response: APIGatewayProxyResult = { statusCode: 200, body: "" };

  try {
    const postId = event.pathParameters?.postId;
    if (!postId) {
      throw new Error("postId is required in pathParameters.");
    }

    const params: GetItemCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: marshall({ postId }),
    };

    const { Item } = await dbClient.send(new GetItemCommand(params));

    response.body = JSON.stringify({
      message: "Successfully retrieved post.",
      data: Item ? unmarshall(Item) : {},
      rawData: Item,
    });
  } catch (e: any) {
    console.error(e);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to get post.",
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }

  return response;
};

export const createPost = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const response: APIGatewayProxyResult = { statusCode: 200, body: "" };

  try {
    const body = event.body ? JSON.parse(event.body) : null;

    if (!body) {
      throw new Error("Missing request body.");
    }

    const postId = uuidv4();
    const newPost = {
      postId,
      ...body,
    };

    const params: PutItemCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: marshall(newPost),
    };

    const createResult = await dbClient.send(new PutItemCommand(params));

    response.body = JSON.stringify({
      message: "Successfully created post.",
      postId,
      createResult,
    });
  } catch (e: any) {
    console.error(e);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to create post.",
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }

  return response;
};

export const getAllPosts = async (): Promise<APIGatewayProxyResult> => {
  const response: APIGatewayProxyResult = { statusCode: 200, body: "" };

  try {
    const params: ScanCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
    };

    const { Items } = await dbClient.send(new ScanCommand(params));

    response.body = JSON.stringify({
      message: "Successfully retrieved all posts.",
      data: Items?.map((item) => unmarshall(item)) || [],
      Items,
    });
  } catch (e: any) {
    console.error(e);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to retrieve posts.",
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }

  return response;
};
