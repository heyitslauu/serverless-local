import { v4 as uuidv4 } from "uuid";

import dbClient from "../db/dbClient";

import { type Post } from "../types/Post";
import {
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  GetItemCommandInput,
  PutItemCommandInput,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export const getPost = async (postId: string) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME!,
    Key: {
      sample_id: { S: postId },
    },
  };

  const result = await dbClient.send(new GetItemCommand(params));

  if (!result.Item) {
    throw new Error("Post not found.");
  }

  return unmarshall(result.Item);
};

export const createPost = async (body: Post) => {
  const postId = uuidv4();
  const newPost = {
    sample_id: postId,
    ...body,
  };

  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME!,
    Item: marshall(newPost),
  };

  const createResult = await dbClient.send(new PutItemCommand(params));
  return { postId, createResult };
};

export const getAllPosts = async () => {
  const params: ScanCommandInput = {
    TableName: process.env.DYNAMODB_TABLE_NAME!,
  };

  const { Items } = await dbClient.send(new ScanCommand(params));

  return Items?.map((item) => unmarshall(item)) || [];
};
