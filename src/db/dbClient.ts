import "dotenv/config";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const isOffline = process.env.IS_OFFLINE === "true";

const client = new DynamoDBClient(
  isOffline
    ? {
        region: "ap-southeast-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
      }
    : {
        region: "ap-southeast-1",
      }
);

export default client;
