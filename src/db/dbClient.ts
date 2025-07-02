import "dotenv/config";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const isOffline = true;

const client = new DynamoDBClient(
  !isOffline
    ? {
        region: "ap-southeast-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      }
    : {
        region: "ap-southeast-1",
        credentials: {
          accessKeyId: "fakeuser",
          secretAccessKey: "fakerkey",
        },
        endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
      }
);

export default client;
