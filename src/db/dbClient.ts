import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const isOffline = process.env.IS_OFFLINE === "true";

const client = new DynamoDBClient(
  isOffline
    ? {
        region: "ap-southeast-1",
        credentials: {
          accessKeyId: "fakeuser",
          secretAccessKey: "fakerkey",
        },
        endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
      }
    : {
        region: "ap-southeast-1",
      }
);

export default client;
