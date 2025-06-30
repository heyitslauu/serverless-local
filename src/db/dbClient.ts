import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: "fakeuser",
    secretAccessKey: "fakerkey",
  },
  endpoint: "http://localhost:8000", // DynamoDB Local
});

export default client;
